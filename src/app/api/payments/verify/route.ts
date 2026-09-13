import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getPaymentProvider } from "@/lib/payments/provider";
import { sendPaymentNotification } from "@/lib/email";

/**
 * POST /api/payments/verify
 *
 * Body: { reference: string }
 *
 * Verifies a Paystack transaction by reference. Updates the matching
 * Payment record and (if successful) advances the order status.
 *
 * This is the primary success path — called by the frontend when
 * Paystack redirects back to the app with the reference in the URL.
 * The webhook (separately) is the authoritative backstop in case the
 * user closes the tab before the redirect completes.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json({ error: "reference is required" }, { status: 400 });
    }

    const payment = await db.payment.findUnique({
      where: { reference },
    });
    if (!payment) {
      return NextResponse.json({ error: "Payment reference not found" }, { status: 404 });
    }
    if (payment.customerId !== user.id) {
      return NextResponse.json(
        { error: "This payment wasn't initiated by you" },
        { status: 403 },
      );
    }
    if (payment.status === "SUCCESS") {
      return NextResponse.json({
        alreadyVerified: true,
        payment: { status: "SUCCESS", reference, amount: payment.amount },
      });
    }

    // Fetch the matching order separately — Payment doesn't have a
    // foreign-key relation to Order in the SQLite schema (and a
    // non-required relation would need an additional index column on
    // Order). Cheap enough to just do a second query.
    const order = payment.orderId
      ? await db.order.findUnique({ where: { id: payment.orderId } })
      : null;

    const provider = getPaymentProvider();
    const result = await provider.verify(reference);

    const newStatus =
      result.status === "success" ? "SUCCESS" :
      result.status === "pending" ? "PENDING" :
      result.status === "abandoned" ? "ABANDONED" : "FAILED";

    // ⚠ Amount re-check. Previously, if the customer manipulated the
    // order total (e.g. via negative quantities or a forged
    // deliveryFee — both now blocked at order creation, but defense
    // in depth) and Paystack charged a different amount, we'd still
    // mark the order CONFIRMED. We now require the gateway's reported
    // amount to match the order total within 1 NGN (rounding grace for
    // kobo conversion).
    //
    // We skip this check for the mock provider because its `verify`
    // always returns `amountNaira: 0` (the mock doesn't know about
    // the order — the caller already does).
    if (
      newStatus === "SUCCESS" &&
      provider.name !== "mock" &&
      order &&
      result.amountNaira > 0 &&
      Math.abs(result.amountNaira - order.total) > 1
    ) {
      console.error(
        `[payments/verify] amount mismatch for ${reference}: ` +
          `gateway=${result.amountNaira} naira, order=${order.total} naira`,
      );
      await db.payment.update({
        where: { reference },
        data: {
          status: "FAILED",
          providerResponse: JSON.stringify({
            ...result,
            mismatchReason: `amount ${result.amountNaira} ≠ order.total ${order.total}`,
          }),
        },
      });
      return NextResponse.json(
        {
          status: "FAILED",
          reason: "amount_mismatch",
          expected: order.total,
          received: result.amountNaira,
          orderId: payment.orderId,
        },
        { status: 402 },
      );
    }

    await db.payment.update({
      where: { reference },
      data: {
        status: newStatus,
        // Stringify the provider's verify response — SQLite stores
        // providerResponse as a `String?` column. MongoDB would store
        // it as a sub-document, but for cross-compatibility we
        // serialize to JSON here. (The MongoDB schema declares it as
        // `Json?` which accepts strings too.)
        providerResponse: JSON.stringify(result),
      },
    });

    if (newStatus === "SUCCESS" && order) {
      // Advance the order out of PLACED → CONFIRMED, since the vendor
      // can now safely accept it.
      if (order.status === "PLACED") {
        await db.order.update({
          where: { id: order.id },
          data: { status: "CONFIRMED" },
        });
      }

      // Fire payment-success email (idempotent per reference).
      try {
        await sendPaymentNotification({
          userId: user.id,
          email: user.email,
          name: user.name,
          reference,
          status: "SUCCESS",
          amount: payment.amount,
          orderCode: order.code,
          type: "PAYMENT_SUCCESS",
        });
      } catch (emailErr) {
        console.error("[payments/verify] email failed:", emailErr);
      }
    } else if (newStatus === "FAILED" && order) {
      try {
        await sendPaymentNotification({
          userId: user.id,
          email: user.email,
          name: user.name,
          reference,
          status: "FAILED",
          amount: payment.amount,
          orderCode: order.code,
          type: "PAYMENT_FAILED",
        });
      } catch (emailErr) {
        console.error("[payments/verify] email failed:", emailErr);
      }
    }

    return NextResponse.json({
      status: newStatus,
      amount: payment.amount,
      orderId: payment.orderId,
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error("[payments/verify POST] error", err);
    return NextResponse.json(
      { error: err.message || "Failed to verify payment" },
      { status: 500 },
    );
  }
}
