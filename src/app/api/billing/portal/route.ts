import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getStripe } from "@/lib/billing/stripe";

export async function POST(request: NextRequest) {
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

  const { data: customer } = await supabase
    .from("customers")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!customer?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account found" },
      { status: 404 },
    );
  }

  const stripe = getStripe();
  const origin = request.headers.get("origin") ?? "";

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: `${origin}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
