import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  generateBadgeSvg,
  generateFallbackBadgeSvg,
  type BadgeStyle,
} from "@/lib/badge";
import type { Grade } from "@/types/scanner";

const VALID_STYLES = new Set<string>(["flat", "flat-square"]);

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
    return svgResponse(generateFallbackBadgeSvg(label, style), 300);
  }

  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("shared_results")
    .select("grade")
    .eq("share_id", projectId)
    .single();

  if (error || !data) {
    return svgResponse(generateFallbackBadgeSvg(label, style), 300);
  }

  const grade = data.grade as Grade;

  return svgResponse(generateBadgeSvg({ grade, label, style }), 3600);
}
