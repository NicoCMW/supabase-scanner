import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const checks: Record<string, string> = { status: "ok" };

  try {
    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("scan_jobs").select("id").limit(1);
    checks.database = error ? "degraded" : "ok";
  } catch {
    checks.database = "down";
  }

  const allHealthy = Object.values(checks).every((v) => v === "ok");

  return NextResponse.json(
    { ...checks, timestamp: new Date().toISOString() },
    { status: allHealthy ? 200 : 503 },
  );
}
