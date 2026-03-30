import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  generateBadgeSvg,
  generateFallbackBadgeSvg,
  type BadgeStyle,
} from "@/lib/badge";
import type { Grade } from "@/types/scanner";

const VALID_STYLES = new Set<string>(["flat", "flat-square"]);
const VALID_GRADES = new Set<string>(["A", "B", "C", "D", "F"]);

const CACHE_HIT_SECONDS = 86400; // 24 hours
const CACHE_MISS_SECONDS = 300; // 5 minutes

function svgResponse(svg: string, cacheSeconds: number): NextResponse {
  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`,
      "Access-Control-Allow-Origin": "*",
    },
  });
}

async function lookupGrade(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  projectId: string,
): Promise<Grade | null> {
  // Try shared_results first (share_id lookup)
  const { data: shared } = await supabase
    .from("shared_results")
    .select("grade")
    .eq("share_id", projectId)
    .single();

  if (shared?.grade && VALID_GRADES.has(shared.grade)) {
    return shared.grade as Grade;
  }

  // Fall back to team_projects (UUID lookup)
  const { data: teamProject } = await supabase
    .from("team_projects")
    .select("last_scan_grade")
    .eq("id", projectId)
    .single();

  if (teamProject?.last_scan_grade && VALID_GRADES.has(teamProject.last_scan_grade)) {
    return teamProject.last_scan_grade as Grade;
  }

  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const url = new URL(request.url);

  const rawStyle = url.searchParams.get("style") ?? "flat";
  const style: BadgeStyle = VALID_STYLES.has(rawStyle)
    ? (rawStyle as BadgeStyle)
    : "flat";
  const label = url.searchParams.get("label") ?? "SupaScanner";

  if (!projectId || projectId.length < 5) {
    return svgResponse(generateFallbackBadgeSvg(label, style), CACHE_MISS_SECONDS);
  }

  const supabase = createSupabaseAdmin();
  const grade = await lookupGrade(supabase, projectId);

  if (!grade) {
    return svgResponse(generateFallbackBadgeSvg(label, style), CACHE_MISS_SECONDS);
  }

  return svgResponse(generateBadgeSvg({ grade, label, style }), CACHE_HIT_SECONDS);
}
