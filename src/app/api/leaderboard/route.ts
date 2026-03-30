import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { Grade } from "@/types/scanner";

const GRADE_ORDER: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, F: 5 };
const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 25;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(url.searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10)),
  );
  const gradeFilter = url.searchParams.get("grade");

  const supabase = createSupabaseAdmin();

  let query = supabase
    .from("leaderboard_entries")
    .select("*", { count: "exact" })
    .order("grade", { ascending: true })
    .order("total_findings", { ascending: true })
    .order("scan_date", { ascending: false });

  if (gradeFilter && GRADE_ORDER[gradeFilter] !== undefined) {
    query = query.eq("grade", gradeFilter);
  }

  const offset = (page - 1) * pageSize;
  query = query.range(offset, offset + pageSize - 1);

  const { data: entries, count, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 },
    );
  }

  const { data: statsData } = await supabase.rpc("leaderboard_stats");

  const mapped = (entries ?? []).map((entry, index) => ({
    id: entry.id,
    displayName: entry.display_name,
    grade: entry.grade as Grade,
    totalFindings: entry.total_findings,
    criticalCount: entry.critical_count,
    highCount: entry.high_count,
    mediumCount: entry.medium_count,
    lowCount: entry.low_count,
    scanDate: entry.scan_date,
    shareId: entry.share_id,
    rank: offset + index + 1,
  }));

  const total = count ?? 0;

  return NextResponse.json(
    {
      entries: mapped,
      total,
      page,
      pageSize,
      stats: {
        totalEntries: statsData?.totalEntries ?? total,
        gradeDistribution: statsData?.gradeDistribution ?? {},
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=120",
      },
    },
  );
}

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { sharedResultId, displayName } = body as Record<string, unknown>;

  if (typeof sharedResultId !== "string") {
    return NextResponse.json(
      { error: "Missing required field: sharedResultId" },
      { status: 400 },
    );
  }

  const safeName =
    typeof displayName === "string" && displayName.trim().length > 0
      ? displayName.trim().slice(0, 50)
      : "Anonymous Project";

  const { data: sharedResult } = await supabase
    .from("shared_results")
    .select("*")
    .eq("id", sharedResultId)
    .single();

  if (!sharedResult) {
    return NextResponse.json(
      { error: "Shared result not found" },
      { status: 404 },
    );
  }

  if (sharedResult.user_id !== user.id) {
    return NextResponse.json(
      { error: "You can only add your own results to the leaderboard" },
      { status: 403 },
    );
  }

  const { data: existing } = await supabase
    .from("leaderboard_entries")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    const { error: updateError } = await supabase
      .from("leaderboard_entries")
      .update({
        shared_result_id: sharedResultId,
        display_name: safeName,
        grade: sharedResult.grade,
        total_findings: sharedResult.total_findings,
        critical_count: sharedResult.critical_count,
        high_count: sharedResult.high_count,
        medium_count: sharedResult.medium_count,
        low_count: sharedResult.low_count,
        scan_date: sharedResult.scan_date,
        share_id: sharedResult.share_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update leaderboard entry" },
        { status: 500 },
      );
    }

    return NextResponse.json({ updated: true });
  }

  const { error: insertError } = await supabase
    .from("leaderboard_entries")
    .insert({
      shared_result_id: sharedResultId,
      user_id: user.id,
      display_name: safeName,
      grade: sharedResult.grade,
      total_findings: sharedResult.total_findings,
      critical_count: sharedResult.critical_count,
      high_count: sharedResult.high_count,
      medium_count: sharedResult.medium_count,
      low_count: sharedResult.low_count,
      scan_date: sharedResult.scan_date,
      share_id: sharedResult.share_id,
    });

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to join leaderboard" },
      { status: 500 },
    );
  }

  return NextResponse.json({ created: true }, { status: 201 });
}

export async function DELETE() {
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
    .from("leaderboard_entries")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to leave leaderboard" },
      { status: 500 },
    );
  }

  return NextResponse.json({ removed: true });
}
