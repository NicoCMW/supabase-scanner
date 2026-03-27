import { NextRequest, NextResponse } from "next/server";
import { runScan, validateTarget } from "@/lib/scanner";
import type { ScanTarget } from "@/types/scanner";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { supabaseUrl, anonKey } = body as Record<string, unknown>;

  if (typeof supabaseUrl !== "string" || typeof anonKey !== "string") {
    return NextResponse.json(
      { error: "Missing required fields: supabaseUrl, anonKey" },
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

  try {
    const result = await runScan(target);

    return NextResponse.json({
      grade: result.grade,
      totalFindings: result.totalFindings,
      modules: result.modules,
      durationMs: result.durationMs,
      startedAt: result.startedAt,
      completedAt: result.completedAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
