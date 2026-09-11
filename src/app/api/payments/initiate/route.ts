import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getPaymentProvider, isPaystackConfigured } from "@/lib/payments/provider";

/**
 * POST /api/payments/initiate
 *
 * Body: { orderId: string }
 *
 * Initiates a Paystack transaction for an order. Returns the
 * Paystack authorization URL the frontend should redirect to.
 *
 * Flow:
 *   1. Require auth.
 *   2. Load the order, ensure it belongs to the caller and isn't already paid.
 *   3. Create a Payment record (status=INITIALIZED).
 *   4. Call Paystack to initialize the transaction.
 *   5. Return the authorization URL.
 *
 * When Paystack isn't configured, falls back to a "mock payment" mode
 * that auto-succeeds — useful for development and end-to-end testing.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { vendor: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.customerId !== user.id) {
      return NextResponse.json(
        { error: "You don't own this order" },
        { status: 403 },
      );
    }
    if (order.status === "DELIVERED" || order.status === "CANCELLED") {
      return NextResponse.json(
        { error: `Order is ${order.status.toLowerCase()} — cannot pay.` },
        { status: 400 },
      );
    }

    // Pick the provider (Paystack when configured, mock otherwise).
    const provider = getPaymentProvider();
    const isMock = provider.name === "mock";

    const init = await provider.initiate({
      orderId: order.id,
      email: user.email,
      amountNaira: order.total,
      description: `RUSH order ${order.code} — ${order.vendor.businessName}`,
      metadata: {
        orderCode: order.code,
        vendorName: order.vendor.businessName,
        items: order.items,
      },
    });

    // Record the Payment so we can reconcile at verify time.
    // Use upsert by reference so a re-initiate (e.g. customer retried
    // after closing the tab) updates the same record.
    await db.payment.upsert({
      where: { reference: init.reference },
      create: {
        reference: init.reference,
        orderId: order.id,
        customerId: user.id,
        amount: order.total,
        currency: "NGN",
        provider: provider.name,
        status: "INITIALIZED",
      },
      update: { status: "INITIALIZED" },
    });

    return NextResponse.json({
      reference: init.reference,
      authorizationUrl: init.authorizationUrl,
      provider: provider.name,
      isMock,
      paystackConfigured: isPaystackConfigured,
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error("[payments/initiate POST] error", err);
    return NextResponse.json(
      { error: err.message || "Failed to initiate payment" },
      { status: 500 },
    );
  }
}
