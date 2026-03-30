import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/billing/usage";
import {
  generateScanReportPdf,
  buildReportData,
} from "@/lib/pdf/generate-report";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ scanJobId: string }> },
) {
  const { scanJobId } = await params;
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

  const { data: scanJob, error: jobError } = await supabase
    .from("scan_jobs")
    .select("id, supabase_url, status, grade, total_findings, created_at")
    .eq("id", scanJobId)
    .single();

  if (jobError || !scanJob) {
    return NextResponse.json(
      { error: "Scan not found" },
      { status: 404 },
    );
  }

  if (scanJob.status !== "completed" || !scanJob.grade) {
    return NextResponse.json(
      { error: "Scan is not yet completed" },
      { status: 400 },
    );
  }

  const planId = await getUserPlan(supabase, user.id);
  const isPro = planId === "pro";

  const { data: findings } = await supabase
    .from("findings")
    .select("title, severity, category, resource, description, remediation")
    .eq("scan_job_id", scanJobId)
    .order("severity", { ascending: true });

  const reportData = buildReportData(scanJob, findings ?? []);
  const pdfBuffer = generateScanReportPdf(reportData, isPro);

  const filename = isPro
    ? `supascanner-report-${scanJob.grade}-${new Date(scanJob.created_at).toISOString().slice(0, 10)}.pdf`
    : `supascanner-summary-${scanJob.grade}-${new Date(scanJob.created_at).toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
