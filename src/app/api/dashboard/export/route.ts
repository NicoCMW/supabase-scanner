import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

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

  const { data: scanJobs, error } = await supabase
    .from("scan_jobs")
    .select("id, supabase_url, status, grade, total_findings, duration_ms, created_at, completed_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch scan history" },
      { status: 500 },
    );
  }

  const header = "Date,URL,Status,Grade,Findings,Duration (ms)";
  const rows = (scanJobs ?? []).map((job) => {
    const date = new Date(job.created_at).toISOString();
    const url = `"${job.supabase_url.replace(/"/g, '""')}"`;
    return `${date},${url},${job.status},${job.grade ?? ""},${job.total_findings},${job.duration_ms ?? ""}`;
  });

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="scan-history-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
