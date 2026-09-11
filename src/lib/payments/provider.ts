import "server-only";

/**
 * Payment provider abstraction — provider-agnostic interface so we
 * can swap Paystack for Flutterwave/Stripe later without touching
 * the call sites.
 *
 * Today only Paystack is implemented. When the time comes to add
 * another provider, implement this interface for it and switch the
 * active provider based on env vars.
 */

export interface InitiateInput {
  orderId?: string;
  email: string;
  amountNaira: number;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface InitiateResult {
  reference: string;
  authorizationUrl: string;
  accessCode: string;
}

export interface VerifyResult {
  status: "success" | "failed" | "pending" | "abandoned";
  amountNaira: number;
  currency: string;
  reference: string;
  gatewayResponse: string;
  channel: string;
  customerEmail: string;
  paidAt: string;
}

export interface PaymentProvider {
  name: string;
  isConfigured: boolean;
  initiate(input: InitiateInput): Promise<InitiateResult>;
  verify(reference: string): Promise<VerifyResult>;
  verifyWebhookSignature(rawBody: string, signature: string | null): Promise<boolean>;
}

export { isPaystackConfigured } from "./paystack";

import * as paystack from "./paystack";

export const activePaymentProvider: PaymentProvider = {
  name: "paystack",
  isConfigured: paystack.isPaystackConfigured,
  initiate: paystack.initiateTransaction,
  verify: paystack.verifyTransaction,
  verifyWebhookSignature: paystack.verifyWebhookSignature,
};

/**
 * Mock payment provider — used when Paystack isn't configured.
 * Pretends every payment succeeds; returns a fake reference and
 * a fake authorization URL that just redirects back to the return URL.
 * Useful for development and end-to-end testing of the checkout flow.
 */
export const mockPaymentProvider: PaymentProvider = {
  name: "mock",
  isConfigured: true,
  async initiate(input) {
    const ref = `mock-${input.orderId || "wallet"}-${Date.now()}`;
    // NEXT_PUBLIC_APP_URL is optional. When it's not set, use a dummy
    // absolute base for the URL constructor, then return only the
    // pathname + query — the browser resolves relative URLs against
    // the current origin when window.location.href is assigned.
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost";
    const url = new URL(`${base}/checkout?paid=1&reference=${ref}`);
    return {
      reference: ref,
      authorizationUrl: process.env.NEXT_PUBLIC_APP_URL
        ? url.toString()
        : url.pathname + url.search,
      accessCode: ref,
    };
  },
  async verify(reference) {
    return {
      status: "success",
      amountNaira: 0, // unknown for mock; the caller already knows
      currency: "NGN",
      reference,
      gatewayResponse: "Mock payment succeeded",
      channel: "mock",
      customerEmail: "",
      paidAt: new Date().toISOString(),
    };
  },
  async verifyWebhookSignature() {
    return false; // mock has no webhook
  },
};

/**
 * Returns the provider to actually use for a given request.
 * Falls back to mock when Paystack isn't configured.
 */
export function getPaymentProvider(): PaymentProvider {
  return activePaymentProvider.isConfigured ? activePaymentProvider : mockPaymentProvider;
}
