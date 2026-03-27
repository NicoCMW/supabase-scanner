import type { SupabaseClient } from "@supabase/supabase-js";

export type ScheduleFrequency = "weekly" | "monthly";

export interface ScanSchedule {
  readonly id: string;
  readonly user_id: string;
  readonly supabase_url: string;
  readonly encrypted_anon_key: string;
  readonly frequency: ScheduleFrequency;
  readonly enabled: boolean;
  readonly next_run_at: string;
  readonly last_run_at: string | null;
  readonly last_scan_job_id: string | null;
  readonly consecutive_failures: number;
  readonly created_at: string;
  readonly updated_at: string;
}

/** Public view returned to the client (never exposes encrypted key). */
export interface ScanScheduleView {
  readonly id: string;
  readonly supabase_url: string;
  readonly frequency: ScheduleFrequency;
  readonly enabled: boolean;
  readonly next_run_at: string;
  readonly last_run_at: string | null;
  readonly last_scan_job_id: string | null;
  readonly consecutive_failures: number;
  readonly created_at: string;
}

const MAX_SCHEDULES_PER_USER = 5;
const MAX_CONSECUTIVE_FAILURES = 3;

export function computeNextRunAt(frequency: ScheduleFrequency, from?: Date): string {
  const base = from ?? new Date();
  const next = new Date(base);

  if (frequency === "weekly") {
    next.setDate(next.getDate() + 7);
  } else {
    next.setMonth(next.getMonth() + 1);
  }

  return next.toISOString();
}

export function toScheduleView(s: ScanSchedule): ScanScheduleView {
  return {
    id: s.id,
    supabase_url: s.supabase_url,
    frequency: s.frequency,
    enabled: s.enabled,
    next_run_at: s.next_run_at,
    last_run_at: s.last_run_at,
    last_scan_job_id: s.last_scan_job_id,
    consecutive_failures: s.consecutive_failures,
    created_at: s.created_at,
  };
}

export async function getUserScheduleCount(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count } = await supabase
    .from("scan_schedules")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return count ?? 0;
}

export async function canCreateSchedule(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const count = await getUserScheduleCount(supabase, userId);
  if (count >= MAX_SCHEDULES_PER_USER) {
    return {
      allowed: false,
      reason: `Maximum ${MAX_SCHEDULES_PER_USER} schedules per account.`,
    };
  }
  return { allowed: true };
}

export { MAX_SCHEDULES_PER_USER, MAX_CONSECUTIVE_FAILURES };
