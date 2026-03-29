/**
 * Runtime check for Stripe configuration availability.
 * Server-side: checks STRIPE_SECRET_KEY.
 * Client-side: check NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY via isBillingEnabled().
 */

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function isBillingEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}
