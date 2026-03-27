import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailPreferences } from "./types";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://supascanner.com";

/**
 * Get or create email preferences for a user.
 * Uses the admin client to bypass RLS for initial creation.
 */
export async function getOrCreatePreferences(
  adminClient: SupabaseClient,
  userId: string,
): Promise<EmailPreferences> {
  const { data: existing } = await adminClient
    .from("email_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (existing) {
    return existing as EmailPreferences;
  }

  const { data: created, error } = await adminClient
    .from("email_preferences")
    .insert({ user_id: userId })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create email preferences: ${error.message}`);
  }

  return created as EmailPreferences;
}

/**
 * Get email preferences by unsubscribe token.
 * Used for one-click unsubscribe without authentication.
 */
export async function getPreferencesByToken(
  adminClient: SupabaseClient,
  token: string,
): Promise<EmailPreferences | null> {
  const { data } = await adminClient
    .from("email_preferences")
    .select("*")
    .eq("unsubscribe_token", token)
    .single();

  return (data as EmailPreferences) ?? null;
}

/**
 * Update email preferences by unsubscribe token.
 */
export async function updatePreferencesByToken(
  adminClient: SupabaseClient,
  token: string,
  updates: Partial<
    Pick<
      EmailPreferences,
      "welcome_email" | "scan_results_email" | "weekly_digest_email"
    >
  >,
): Promise<EmailPreferences | null> {
  const { data, error } = await adminClient
    .from("email_preferences")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("unsubscribe_token", token)
    .select("*")
    .single();

  if (error) {
    return null;
  }

  return data as EmailPreferences;
}

/**
 * Update email preferences for an authenticated user.
 */
export async function updatePreferences(
  supabase: SupabaseClient,
  userId: string,
  updates: Partial<
    Pick<
      EmailPreferences,
      "welcome_email" | "scan_results_email" | "weekly_digest_email"
    >
  >,
): Promise<EmailPreferences | null> {
  const { data, error } = await supabase
    .from("email_preferences")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    return null;
  }

  return data as EmailPreferences;
}

/**
 * Build the unsubscribe URL for a given token.
 */
export function buildUnsubscribeUrl(token: string): string {
  return `${SITE_URL}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
}
