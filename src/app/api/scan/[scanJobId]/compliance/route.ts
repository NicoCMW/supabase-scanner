import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/billing/usage";
import {
  mapFindingsToFramework,
  type ComplianceFramework,
  type MappedFinding,
} from "@/lib/compliance/frameworks";
import { generateSoc2ReportPdf } from "@/lib/compliance/generate-soc2-report";
import { generateHipaaReportPdf } from "@/lib/compliance/generate-hipaa-report";
import { generateExecutiveSummaryPdf } from "@/lib/compliance/generate-executive-summary";

const VALID_FRAMEWORKS = new Set(["soc2", "hipaa", "executive"]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ scanJobId: string }> },
) {
  const { scanJobId } = await params;
  const { searchParams } = new URL(request.url);
  const framework = searchParams.get("framework") ?? "executive";

  if (!VALID_FRAMEWORKS.has(framework)) {
    return NextResponse.json(
      { error: "Invalid framework. Use: soc2, hipaa, or executive" },
      { status: 400 },
    );
  }

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
  if (planId !== "pro") {
    return NextResponse.json(
      {
        error: "Compliance reports require a Pro subscription",
        upgrade: true,
      },
      { status: 403 },
    );
  }

  const { data: scanJob, error: jobError } = await supabase
    .from("scan_jobs")
    .select("id, supabase_url, status, grade, total_findings, created_at")
    .eq("id", scanJobId)
    .single();

  if (jobError || !scanJob) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  if (scanJob.status !== "completed" || !scanJob.grade) {
    return NextResponse.json(
      { error: "Scan is not yet completed" },
      { status: 400 },
    );
  }

  const { data: findings } = await supabase
    .from("findings")
    .select("title, severity, category, resource, description, remediation")
    .eq("scan_job_id", scanJobId)
    .order("severity", { ascending: true });

  const mappedFindings: readonly MappedFinding[] = (findings ?? []).map(
    (f) => ({
      title: f.title,
      severity: f.severity,
      category: f.category,
      resource: f.resource,
      description: f.description,
      remediation: f.remediation,
    }),
  );

  const dateStr = new Date(scanJob.created_at).toISOString().slice(0, 10);
  let pdfBuffer: ArrayBuffer;
  let filename: string;

  if (framework === "soc2") {
    const results = mapFindingsToFramework(mappedFindings, "soc2");
    pdfBuffer = generateSoc2ReportPdf({
      targetUrl: scanJob.supabase_url,
      scannedAt: scanJob.created_at,
      grade: scanJob.grade,
      results,
    });
    filename = `supascanner-soc2-readiness-${dateStr}.pdf`;
  } else if (framework === "hipaa") {
    const results = mapFindingsToFramework(mappedFindings, "hipaa");
    pdfBuffer = generateHipaaReportPdf({
      targetUrl: scanJob.supabase_url,
      scannedAt: scanJob.created_at,
      grade: scanJob.grade,
      results,
    });
    filename = `supascanner-hipaa-checklist-${dateStr}.pdf`;
  } else {
    const soc2Results = mapFindingsToFramework(mappedFindings, "soc2");
    const hipaaResults = mapFindingsToFramework(mappedFindings, "hipaa");
    pdfBuffer = generateExecutiveSummaryPdf({
      targetUrl: scanJob.supabase_url,
      scannedAt: scanJob.created_at,
      grade: scanJob.grade,
      totalFindings: scanJob.total_findings,
      criticalCount: mappedFindings.filter((f) => f.severity === "critical")
        .length,
      highCount: mappedFindings.filter((f) => f.severity === "high").length,
      mediumCount: mappedFindings.filter((f) => f.severity === "medium").length,
      lowCount: mappedFindings.filter((f) => f.severity === "low").length,
      soc2Results,
      hipaaResults,
    });
    filename = `supascanner-compliance-summary-${dateStr}.pdf`;
  }

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
