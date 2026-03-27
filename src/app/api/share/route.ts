import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { Severity } from "@/types/scanner";

function generateShareId(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  const segments = [4, 4, 4];
  return segments
    .map((len) => {
      let segment = "";
      const bytes = crypto.getRandomValues(new Uint8Array(len));
      for (let i = 0; i < len; i++) {
        segment += chars[bytes[i] % chars.length];
      }
      return segment;
    })
    .join("-");
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

  const { scanJobId } = body as Record<string, unknown>;

  if (typeof scanJobId !== "string") {
    return NextResponse.json(
      { error: "Missing required field: scanJobId" },
      { status: 400 },
    );
  }

  // Verify scan job exists and belongs to user
  const { data: scanJob } = await supabase
    .from("scan_jobs")
    .select("id, user_id, grade, total_findings, created_at, status")
    .eq("id", scanJobId)
    .single();

  if (!scanJob) {
    return NextResponse.json(
      { error: "Scan job not found" },
      { status: 404 },
    );
  }

  if (scanJob.status !== "completed" || !scanJob.grade) {
    return NextResponse.json(
      { error: "Scan must be completed before sharing" },
      { status: 422 },
    );
  }

  // Check if already shared
  const { data: existing } = await supabase
    .from("shared_results")
    .select("share_id")
    .eq("scan_job_id", scanJobId)
    .single();

  if (existing) {
    return NextResponse.json({ shareId: existing.share_id });
  }

  // Count findings by severity
  const { data: findings } = await supabase
    .from("findings")
    .select("severity")
    .eq("scan_job_id", scanJobId);

  const countBySeverity = (s: Severity) =>
    (findings ?? []).filter(
      (f: { severity: string }) => f.severity === s,
    ).length;

  const shareId = generateShareId();

  const { error: insertError } = await supabase
    .from("shared_results")
    .insert({
      share_id: shareId,
      scan_job_id: scanJobId,
      user_id: user.id,
      grade: scanJob.grade,
      scan_date: scanJob.created_at,
      critical_count: countBySeverity("critical"),
      high_count: countBySeverity("high"),
      medium_count: countBySeverity("medium"),
      low_count: countBySeverity("low"),
      total_findings: scanJob.total_findings,
    });

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to create share" },
      { status: 500 },
    );
  }

  return NextResponse.json({ shareId });
}
