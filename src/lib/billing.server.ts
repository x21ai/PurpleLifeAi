import Stripe from "stripe";

/**
 * Lazily build a Stripe client. Returns null when the secret is missing or
 * still a placeholder so the rest of the app can render normally before
 * billing is configured.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith("sk_")) return null;
  return new Stripe(key, {
    apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export function stripePrices() {
  return {
    monthly: process.env.STRIPE_PRICE_MONTHLY ?? "",
    yearly: process.env.STRIPE_PRICE_YEARLY ?? "",
  };
}

export function billingConfigured(): boolean {
  return getStripe() !== null;
}

export class BillingNotConfiguredError extends Error {
  constructor() {
    super("Billing isn't configured yet. Add STRIPE_SECRET_KEY to enable checkout.");
    this.name = "BillingNotConfiguredError";
  }
}