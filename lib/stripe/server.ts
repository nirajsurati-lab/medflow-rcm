import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeSecretKeyOrThrow() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey || secretKey.trim().length === 0) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }

  return secretKey;
}

export function getStripeWebhookSecretOrThrow() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || webhookSecret.trim().length === 0) {
    throw new Error("Stripe webhook secret is missing.");
  }

  return webhookSecret;
}

export function createStripeServerClient() {
  if (stripeClient) {
    return stripeClient;
  }

  stripeClient = new Stripe(getStripeSecretKeyOrThrow());

  return stripeClient;
}
