import type { SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

const CODE_LENGTH = 8;
const CODE_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

function generateCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  return Array.from(bytes)
    .map((b) => CODE_CHARS[b % CODE_CHARS.length])
    .join("");
}

export interface ReferralCode {
  readonly id: string;
  readonly user_id: string;
  readonly code: string;
  readonly is_active: boolean;
  readonly created_at: string;
}

export interface ReferralStats {
  readonly code: string;
  readonly referralLink: string;
  readonly totalReferred: number;
  readonly totalConverted: number;
  readonly totalCredited: number;
}

export interface Referral {
  readonly id: string;
  readonly referrer_user_id: string;
  readonly referred_user_id: string | null;
  readonly status: string;
  readonly referrer_credited: boolean;
  readonly referred_credited: boolean;
  readonly signed_up_at: string;
  readonly converted_at: string | null;
  readonly credited_at: string | null;
}

/**
 * Get or create a referral code for the given user.
 * Uses admin (service role) client to bypass RLS for insert.
 */
export async function getOrCreateReferralCode(
  adminClient: SupabaseClient,
  userId: string,
): Promise<ReferralCode> {
  const { data: existing } = await adminClient
    .from("referral_codes")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (existing) return existing as ReferralCode;

  // Generate a unique code with retry
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { data, error } = await adminClient
      .from("referral_codes")
      .insert({ user_id: userId, code })
      .select()
      .single();

    if (data) return data as ReferralCode;
    // Unique constraint violation - retry with new code
    if (error?.code === "23505") continue;
    throw error;
  }

  throw new Error("Failed to generate unique referral code after 5 attempts");
}

/**
 * Look up a referral code by its string value.
 */
export async function resolveReferralCode(
  adminClient: SupabaseClient,
  code: string,
): Promise<ReferralCode | null> {
  const { data } = await adminClient
    .from("referral_codes")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .single();

  return data as ReferralCode | null;
}

/**
 * Record that a new user signed up via a referral code.
 * Called from auth callback when a ref cookie is present.
 */
export async function recordReferralSignup(
  adminClient: SupabaseClient,
  referralCode: ReferralCode,
  referredUserId: string,
): Promise<void> {
  // Prevent self-referral
  if (referralCode.user_id === referredUserId) return;

  // Check for duplicate (user already referred)
  const { data: existing } = await adminClient
    .from("referrals")
    .select("id")
    .eq("referred_user_id", referredUserId)
    .single();

  if (existing) return;

  await adminClient.from("referrals").insert({
    referrer_user_id: referralCode.user_id,
    referred_user_id: referredUserId,
    referral_code_id: referralCode.id,
    status: "signed_up",
  });
}

/**
 * Get referral stats for a user's dashboard.
 */
export async function getReferralStats(
  supabase: SupabaseClient,
  userId: string,
  siteUrl: string,
): Promise<ReferralStats | null> {
  const { data: codeRow } = await supabase
    .from("referral_codes")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!codeRow) return null;

  const { data: referrals } = await supabase
    .from("referrals")
    .select("status, referrer_credited")
    .eq("referrer_user_id", userId);

  const list = referrals ?? [];

  return {
    code: codeRow.code,
    referralLink: `${siteUrl}/r/${codeRow.code}`,
    totalReferred: list.length,
    totalConverted: list.filter(
      (r: { status: string }) => r.status === "converted" || r.status === "credited",
    ).length,
    totalCredited: list.filter(
      (r: { referrer_credited: boolean }) => r.referrer_credited,
    ).length,
  };
}

/**
 * Mark a referral as converted when the referred user upgrades to Pro.
 * Also applies credits: creates 1-month free Pro subscriptions for both parties.
 * Called from the Stripe webhook when a new Pro subscription is created.
 */
export async function processReferralConversion(
  adminClient: SupabaseClient,
  referredUserId: string,
): Promise<{ referrerUserId: string } | null> {
  // Find the referral record for this user
  const { data: referral } = await adminClient
    .from("referrals")
    .select("*, referral_codes!inner(user_id)")
    .eq("referred_user_id", referredUserId)
    .eq("status", "signed_up")
    .single();

  if (!referral) return null;

  const referrerUserId = referral.referrer_user_id;

  // Mark as converted
  await adminClient
    .from("referrals")
    .update({
      status: "converted",
      converted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", referral.id);

  return { referrerUserId };
}

/**
 * Mark referral credits as applied after Stripe coupons/credits are granted.
 */
export async function markReferralCredited(
  adminClient: SupabaseClient,
  referredUserId: string,
): Promise<void> {
  await adminClient
    .from("referrals")
    .update({
      status: "credited",
      referrer_credited: true,
      referred_credited: true,
      credited_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("referred_user_id", referredUserId)
    .eq("status", "converted");
}

/**
 * Build the referral link for a given code.
 */
export function buildReferralLink(siteUrl: string, code: string): string {
  return `${siteUrl}/r/${code}`;
}
