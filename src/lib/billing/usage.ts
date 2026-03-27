import type { SupabaseClient } from "@supabase/supabase-js";
import { getPlan } from "./plans";

export interface UsageStatus {
  readonly plan: string;
  readonly scansUsed: number;
  readonly scansLimit: number;
  readonly canScan: boolean;
  readonly periodStart: string;
}

function getCurrentPeriodStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function getUserPlan(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data?.plan ?? "free";
}

export async function getUsageStatus(
  supabase: SupabaseClient,
  userId: string,
): Promise<UsageStatus> {
  const planId = await getUserPlan(supabase, userId);
  const plan = getPlan(planId);
  const periodStart = getCurrentPeriodStart();

  const { data } = await supabase
    .from("usage_records")
    .select("scan_count")
    .eq("user_id", userId)
    .eq("period_start", periodStart)
    .single();

  const scansUsed = data?.scan_count ?? 0;

  return {
    plan: planId,
    scansUsed,
    scansLimit: plan.scansPerMonth,
    canScan: scansUsed < plan.scansPerMonth,
    periodStart,
  };
}

export async function incrementUsage(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const periodStart = getCurrentPeriodStart();

  // Upsert: create record if not exists, increment if exists
  const { data: existing } = await supabase
    .from("usage_records")
    .select("id, scan_count")
    .eq("user_id", userId)
    .eq("period_start", periodStart)
    .single();

  if (existing) {
    await supabase
      .from("usage_records")
      .update({
        scan_count: existing.scan_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("usage_records").insert({
      user_id: userId,
      period_start: periodStart,
      scan_count: 1,
    });
  }
}

export async function checkScanAllowed(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ allowed: boolean; reason?: string; usage: UsageStatus }> {
  const usage = await getUsageStatus(supabase, userId);

  if (!usage.canScan) {
    return {
      allowed: false,
      reason: `Monthly scan limit reached (${usage.scansUsed}/${usage.scansLimit}). Upgrade to Pro for unlimited scans.`,
      usage,
    };
  }

  return { allowed: true, usage };
}
