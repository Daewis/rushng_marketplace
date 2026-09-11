import "server-only";

/**
 * Paystack payment integration — server-side only.
 *
 * Docs: https://paystack.com/docs/api/
 *
 * The flow we support:
 *   1. Customer hits checkout → frontend calls POST /api/payments/initiate
 *      → server creates a Payment record (status=INITIALIZED), asks
 *      Paystack to initialize a transaction, gets back an authorization
 *      URL, returns it to the client.
 *   2. Customer is redirected to Paystack's hosted checkout, completes
 *      payment (card / bank transfer / USSD / etc.).
 *   3. Paystack redirects back to our return URL with a reference.
 *   4. Frontend calls POST /api/payments/verify with the reference
 *      → server verifies the transaction with Paystack, marks the
 *      Payment record SUCCESS (or FAILED), updates the order status.
 *   5. Separately, Paystack fires a webhook to /api/payments/webhook
 *      → server does the same verification (defense in depth; the
 *      redirect-back verify is the primary path, the webhook is the
 *      authoritative backstop in case the customer closes the tab).
 *
 * When PAYSTACK_SECRET_KEY is unset, this module throws — the caller
 * is expected to fall back to "mock payment success" in development.
 */

export const isPaystackConfigured: boolean = Boolean(
  process.env.PAYSTACK_SECRET_KEY,
);

const API_BASE = "https://api.paystack.co";

export interface InitiatePaymentInput {
  /** The RUSH order or wallet-topup id we're collecting payment for. */
  orderId?: string;
  /** Customer's email — required by Paystack for receipt + reconciliation. */
  email: string;
  /** Amount in NAIRA (kobo conversion handled internally). */
  amountNaira: number;
  /** What this payment is for — shows up in the Paystack dashboard. */
  description: string;
  /** Customer's metadata — Paystack stores it and includes in webhook. */
  metadata?: Record<string, unknown>;
}

export interface InitiatePaymentResult {
  reference: string;
  authorizationUrl: string;
  accessCode: string;
}

export async function initiateTransaction(
  input: InitiatePaymentInput,
): Promise<InitiatePaymentResult> {
  if (!isPaystackConfigured) {
    throw new Error(
      "PAYSTACK_SECRET_KEY is not set — Paystack integration disabled. " +
        'Set it in .env to enable real payments, or unset to use "mock payment" mode.',
    );
  }

  const res = await fetch(`${API_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Paystack requires amounts in the smallest currency unit —
      // for NGN that's kobo (1 NGN = 100 kobo).
      amount: Math.round(input.amountNaira * 100),
      currency: "NGN",
      email: input.email,
      // reference must be unique per transaction — use the orderId + timestamp
      // so retries don't collide.
      reference:
        input.orderId
          ? `rush-${input.orderId}-${Date.now()}`
          : `rush-wallet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/checkout?paid=1`,
      metadata: {
        ...input.metadata,
        orderId: input.orderId,
        description: input.description,
      },
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(
      `Paystack initialize failed: ${data.message || res.statusText}`,
    );
  }

  return {
    reference: data.data.reference,
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
  };
}

export interface VerifyTransactionResult {
  status: "success" | "failed" | "pending" | "abandoned";
  amountNaira: number;
  currency: string;
  reference: string;
  gatewayResponse: string;
  channel: string;
  customerEmail: string;
  paidAt: string;
}

export async function verifyTransaction(
  reference: string,
): Promise<VerifyTransactionResult> {
  if (!isPaystackConfigured) {
    throw new Error("PAYSTACK_SECRET_KEY is not set — cannot verify.");
  }

  const res = await fetch(`${API_BASE}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(
      `Paystack verify failed: ${data.message || res.statusText}`,
    );
  }

  const t = data.data;
  return {
    status: t.status, // "success" | "failed" | "pending" | "abandoned"
    amountNaira: t.amount / 100, // kobo → naira
    currency: t.currency,
    reference: t.reference,
    gatewayResponse: t.gateway_response,
    channel: t.channel,
    customerEmail: t.customer.email,
    paidAt: t.paid_at,
  };
}

/**
 * Verify the HMAC signature on a Paystack webhook payload.
 * Paystack signs webhooks with the secret key so we can trust the
 * payload came from them. The signature is the SHA-512 hash of the
 * raw request body, hex-encoded.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): Promise<boolean> {
  if (!isPaystackConfigured || !signature) return false;
  const { createHmac } = await import("node:crypto");
  const expected = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest("hex");
  // Constant-time compare to avoid timing attacks.
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}
