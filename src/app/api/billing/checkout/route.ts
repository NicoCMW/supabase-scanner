import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/billing/stripe";
import { PLANS } from "@/lib/billing/plans";
import { isStripeConfigured } from "@/lib/billing/config";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Billing is not yet available. Check back soon." },
      { status: 503 },
    );
  }

  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const adminClient = createSupabaseAdmin();
  const allowed = await checkRateLimit(
    adminClient,
    `billing:checkout:${user.id}`,
    RATE_LIMITS.billing,
  );
  if (!allowed) return rateLimitResponse();

  const stripe = getStripe();
  const priceId = PLANS.pro.stripePriceId;

  if (!priceId) {
    return NextResponse.json(
      { error: "Pro plan not configured" },
      { status: 500 },
    );
  }

  // Get or create Stripe customer
  const { data: customer } = await supabase
    .from("customers")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  let stripeCustomerId: string;

  if (customer?.stripe_customer_id) {
    stripeCustomerId = customer.stripe_customer_id;
  } else {
    const stripeCustomer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    stripeCustomerId = stripeCustomer.id;

    const adminClient = createSupabaseAdmin();
    await adminClient.from("customers").insert({
      id: user.id,
      stripe_customer_id: stripeCustomerId,
    });
  }

  const origin = request.headers.get("origin") ?? "";

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing`,
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
  });

  return NextResponse.json({ url: session.url });
}
