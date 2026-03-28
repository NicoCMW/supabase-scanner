import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { gradeToScore } from "@/lib/grade-score";
import type { Grade } from "@/types/scanner";

const GRADE_LABELS: Record<Grade, string> = {
  A: "Excellent",
  B: "Good",
  C: "Needs Improvement",
  D: "Poor",
  F: "Critical",
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

function isRateLimited(origin: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(origin);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(origin, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const origin = request.headers.get("origin");
  const headers = {
    ...corsHeaders(origin),
    "Cache-Control": "public, max-age=300, s-maxage=300",
  };

  const rateLimitKey = origin ?? request.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(rateLimitKey)) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers },
    );
  }

  if (!projectId || projectId.length < 5) {
    return NextResponse.json(
      { error: "Invalid project ID" },
      { status: 400, headers },
    );
  }

  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("shared_results")
    .select(
      "grade, scan_date, total_findings, critical_count, high_count, medium_count, low_count",
    )
    .eq("share_id", projectId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404, headers },
    );
  }

  const grade = data.grade as Grade;

  return NextResponse.json(
    {
      grade,
      score: gradeToScore(grade),
      label: GRADE_LABELS[grade],
      totalFindings: data.total_findings,
      critical: data.critical_count,
      high: data.high_count,
      medium: data.medium_count,
      low: data.low_count,
      scanDate: data.scan_date,
    },
    { headers },
  );
}
