import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getOrCreateReferralCode, getReferralStats } from "@/lib/referral";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://supasecscan.com";

/**
 * GET /api/referral
 * Returns the current user's referral code and stats.
 * Auto-generates a referral code if the user doesn't have one yet.
 */
export async function GET() {
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

  // Ensure user has a referral code
  const referralCode = await getOrCreateReferralCode(adminClient, user.id);

  // Get stats using admin client to bypass RLS
  const stats = await getReferralStats(adminClient, user.id, SITE_URL);

  return NextResponse.json({
    code: referralCode.code,
    referralLink: `${SITE_URL}/r/${referralCode.code}`,
    stats: stats
      ? {
          totalReferred: stats.totalReferred,
          totalConverted: stats.totalConverted,
          totalCredited: stats.totalCredited,
        }
      : { totalReferred: 0, totalConverted: 0, totalCredited: 0 },
  });
}
