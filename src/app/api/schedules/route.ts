import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/billing/usage";
import { isProPlan } from "@/lib/billing/plans";
import { encrypt } from "@/lib/crypto";
import { validateTarget } from "@/lib/scanner";
import {
  canCreateSchedule,
  computeNextRunAt,
  toScheduleView,
  type ScanSchedule,
  type ScheduleFrequency,
} from "@/lib/schedules";
import type { ScanTarget } from "@/types/scanner";

/**
 * GET /api/schedules
 * List all scan schedules for the authenticated user.
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

  const { data, error } = await supabase
    .from("scan_schedules")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 },
    );
  }

  const schedules = (data as ScanSchedule[]).map(toScheduleView);
  return NextResponse.json({ schedules });
}

/**
 * POST /api/schedules
 * Create a new scan schedule. Pro users only.
 */
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

  const planId = await getUserPlan(supabase, user.id);
  if (!isProPlan(planId)) {
    return NextResponse.json(
      { error: "Scheduled scans require a Pro subscription." },
      { status: 403 },
    );
  }

  const { allowed, reason } = await canCreateSchedule(supabase, user.id);
  if (!allowed) {
    return NextResponse.json({ error: reason }, { status: 429 });
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

  const { supabaseUrl, anonKey, frequency } = body as Record<string, unknown>;

  if (
    typeof supabaseUrl !== "string" ||
    typeof anonKey !== "string" ||
    typeof frequency !== "string"
  ) {
    return NextResponse.json(
      { error: "Missing required fields: supabaseUrl, anonKey, frequency" },
      { status: 400 },
    );
  }

  if (frequency !== "weekly" && frequency !== "monthly") {
    return NextResponse.json(
      { error: "Frequency must be 'weekly' or 'monthly'" },
      { status: 400 },
    );
  }

  const target: ScanTarget = {
    supabaseUrl: supabaseUrl.trim().replace(/\/+$/, ""),
    anonKey: anonKey.trim(),
  };

  const validation = validateTarget(target);
  if (!validation.valid) {
    return NextResponse.json(
      { error: "Invalid scan target", details: validation.errors },
      { status: 422 },
    );
  }

  const encryptedKey = encrypt(target.anonKey);
  const nextRunAt = computeNextRunAt(frequency as ScheduleFrequency);

  const { data, error } = await supabase
    .from("scan_schedules")
    .insert({
      user_id: user.id,
      supabase_url: target.supabaseUrl,
      encrypted_anon_key: encryptedKey,
      frequency,
      next_run_at: nextRunAt,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A schedule already exists for this Supabase URL." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { schedule: toScheduleView(data as ScanSchedule) },
    { status: 201 },
  );
}
