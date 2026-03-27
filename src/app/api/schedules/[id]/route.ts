import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";
import {
  computeNextRunAt,
  toScheduleView,
  type ScanSchedule,
  type ScheduleFrequency,
} from "@/lib/schedules";

interface RouteContext {
  readonly params: Promise<{ id: string }>;
}

/**
 * PATCH /api/schedules/:id
 * Update a schedule (toggle enabled, change frequency, update credentials).
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const updates = body as Record<string, unknown>;
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof updates.enabled === "boolean") {
    patch.enabled = updates.enabled;
    // Re-enable: reset failures and schedule next run
    if (updates.enabled) {
      patch.consecutive_failures = 0;
      const freq =
        typeof updates.frequency === "string"
          ? (updates.frequency as ScheduleFrequency)
          : undefined;
      // Will compute from current frequency if not changing
      if (freq) {
        patch.next_run_at = computeNextRunAt(freq);
      }
    }
  }

  if (typeof updates.frequency === "string") {
    if (updates.frequency !== "weekly" && updates.frequency !== "monthly") {
      return NextResponse.json(
        { error: "Frequency must be 'weekly' or 'monthly'" },
        { status: 400 },
      );
    }
    patch.frequency = updates.frequency;
    patch.next_run_at = computeNextRunAt(
      updates.frequency as ScheduleFrequency,
    );
  }

  if (typeof updates.anonKey === "string") {
    patch.encrypted_anon_key = encrypt(updates.anonKey.trim());
  }

  const { data, error } = await supabase
    .from("scan_schedules")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Schedule not found or update failed" },
      { status: 404 },
    );
  }

  return NextResponse.json({ schedule: toScheduleView(data as ScanSchedule) });
}

/**
 * DELETE /api/schedules/:id
 * Delete a schedule.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
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

  const { error } = await supabase
    .from("scan_schedules")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 },
    );
  }

  return NextResponse.json({ deleted: true });
}
