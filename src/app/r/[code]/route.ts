import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { resolveReferralCode } from "@/lib/referral";

/**
 * Referral landing route: /r/{code}
 * Validates the referral code, sets a 30-day cookie, and redirects to signup.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const { origin } = new URL(request.url);

  const adminClient = createSupabaseAdmin();
  const referralCode = await resolveReferralCode(adminClient, code);

  if (!referralCode) {
    // Invalid code - redirect to homepage without cookie
    return NextResponse.redirect(`${origin}/`);
  }

  // Set referral cookie and redirect to login/signup
  const response = NextResponse.redirect(`${origin}/login`);
  response.cookies.set("ref", code, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return response;
}
