import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import Stripe from "stripe";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getStripe, getStripeWebhookSecret } from "@/lib/billing/stripe";
import { isStripeConfigured } from "@/lib/billing/config";
import {
  processReferralConversion,
  markReferralCredited,
} from "@/lib/referral";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Billing is not yet available." },
      { status: 503 },
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      getStripeWebhookSecret(),
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdmin();

  switch (event.type) {
    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(supabase, subscription);
      // Process referral credits when a new Pro subscription is created
      await handleReferralCredit(supabase, stripe, subscription).catch(
        (err) => {
          Sentry.captureException(err, {
            extra: { context: "referral_credit", subscriptionId: subscription.id },
          });
        },
      );
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(supabase, subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(supabase, subscription);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionChange(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  subscription: Stripe.Subscription,
) {
  const userId = subscription.metadata.supabase_user_id;
  if (!userId) return;

  const firstItem = subscription.items.data[0];
  const priceId = firstItem?.price?.id ?? "";
  const plan = priceId === process.env.STRIPE_PRO_PRICE_ID ? "pro" : "free";

  const status = mapStripeStatus(subscription.status);

  const periodStart = firstItem?.current_period_start ?? 0;
  const periodEnd = firstItem?.current_period_end ?? 0;

  const record = {
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan,
    status,
    current_period_start: new Date(periodStart * 1000).toISOString(),
    current_period_end: new Date(periodEnd * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };

  await supabase
    .from("subscriptions")
    .upsert(record, { onConflict: "stripe_subscription_id" });
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  subscription: Stripe.Subscription,
) {
  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);
}

function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status,
): string {
  const statusMap: Record<string, string> = {
    active: "active",
    canceled: "canceled",
    past_due: "past_due",
    incomplete: "incomplete",
    trialing: "active",
    unpaid: "past_due",
  };
  return statusMap[stripeStatus] ?? "incomplete";
}

/**
 * When a referred user creates a Pro subscription, apply 1-month credit
 * to both the referrer and the referred user via Stripe coupons.
 */
async function handleReferralCredit(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  stripe: Stripe,
  subscription: Stripe.Subscription,
) {
  const referredUserId = subscription.metadata.supabase_user_id;
  if (!referredUserId) return;

  const priceId = subscription.items.data[0]?.price?.id ?? "";
  const isPro = priceId === process.env.STRIPE_PRO_PRICE_ID;
  if (!isPro) return;

  // Check if this user was referred
  const result = await processReferralConversion(supabase, referredUserId);
  if (!result) return;

  // Create a one-time 100% off coupon for 1 month
  const referredCoupon = await stripe.coupons.create({
    percent_off: 100,
    duration: "once",
    name: "Referral reward: 1 month Pro free",
    metadata: { referral: "true" },
  });

  // Apply discount to the referred user's subscription
  await stripe.subscriptions.update(subscription.id, {
    discounts: [{ coupon: referredCoupon.id }],
  });

  // Apply discount to the referrer's subscription (if they have one)
  const { data: referrerSub } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", result.referrerUserId)
    .eq("status", "active")
    .single();

  if (referrerSub?.stripe_subscription_id) {
    const referrerCoupon = await stripe.coupons.create({
      percent_off: 100,
      duration: "once",
      name: "Referral reward: 1 month Pro free",
      metadata: { referral: "true" },
    });
    await stripe.subscriptions.update(referrerSub.stripe_subscription_id, {
      discounts: [{ coupon: referrerCoupon.id }],
    });
  }

  // Mark referral as credited
  await markReferralCredited(supabase, referredUserId);
}
