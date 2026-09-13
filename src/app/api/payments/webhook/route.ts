import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments/provider";

/**
 * POST /api/payments/webhook
 *
 * Paystack webhook handler. Paystack fires this when a transaction
 * settles (success/failed) — even when the customer closed the tab
 * before our verify endpoint ran. It's the authoritative source of
 * truth for "did this payment actually go through".
 *
 * Verification:
 *   1. Verify the HMAC signature in the `x-paystack-signature` header
 *      against the raw request body.
 *   2. If the signature is valid, parse the JSON body and extract the
 *      Paystack event + reference.
 *   3. For "charge.success", look up the Payment by reference and
 *      mark it SUCCESS. (We don't trust the body alone — we also
 *      re-verify with Paystack's verify endpoint to defend against
 *      a forged-but-signed webhook.)
 *
 * Returns 200 always (Paystack retries on non-2xx).
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    const provider = getPaymentProvider();
    const valid = await provider.verifyWebhookSignature(rawBody, signature);
    if (!valid) {
      // Don't 4xx — Paystack would retry forever. Just log and 200.
      console.warn("[payments/webhook] invalid signature — ignoring");
      return NextResponse.json({ ok: true, ignored: true });
    }

    const event = JSON.parse(rawBody);
    if (event.event !== "charge.success") {
      // We only care about successful charges for now.
      return NextResponse.json({ ok: true, ignored: true });
    }

    const reference = event.data?.reference;
    if (!reference) {
      console.warn("[payments/webhook] missing reference in payload");
      return NextResponse.json({ ok: true });
    }

    // Defense in depth: re-verify with Paystack's API. A signed-but-fake
    // webhook would have to also fool Paystack's own verify endpoint.
    const verified = await provider.verify(reference);
    if (verified.status !== "success") {
      console.warn(`[payments/webhook] verify returned ${verified.status} for ${reference}`);
      return NextResponse.json({ ok: true });
    }

    const payment = await db.payment.findUnique({ where: { reference } });
    if (!payment) {
      // We received a webhook for a payment we don't know about. This
      // happens during testing or if the initiate call failed before
      // recording. Log and move on.
      console.warn(`[payments/webhook] unknown reference ${reference}`);
      return NextResponse.json({ ok: true });
    }

    // Amount re-check (defense in depth, same as the verify route).
    // If the gateway says a different amount was paid than what we
    // expected, do NOT mark SUCCESS — the order should not advance.
    if (payment.amount && verified.amountNaira > 0 && Math.abs(verified.amountNaira - payment.amount) > 1) {
      console.error(
        `[payments/webhook] amount mismatch for ${reference}: ` +
          `gateway=${verified.amountNaira} naira, payment=${payment.amount} naira`,
      );
      await db.payment.update({
        where: { reference },
        data: {
          status: "FAILED",
          providerResponse: JSON.stringify({
            ...verified,
            mismatchReason: `amount ${verified.amountNaira} ≠ payment.amount ${payment.amount}`,
          }),
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (payment.status !== "SUCCESS") {
      await db.payment.update({
        where: { reference },
        data: { status: "SUCCESS", providerResponse: verified as any },
      });
    }

    if (payment.orderId) {
      // Advance the matching order to CONFIRMED (if it's still in PLACED).
      const order = await db.order.findUnique({ where: { id: payment.orderId } });
      if (order && order.status === "PLACED") {
        await db.order.update({
          where: { id: order.id },
          data: { status: "CONFIRMED" },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[payments/webhook] error", err);
    // Still 200 — Paystack would otherwise retry.
    return NextResponse.json({ ok: true });
  }
}
