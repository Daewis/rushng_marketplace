import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getPaymentProvider } from "@/lib/payments/provider";

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
