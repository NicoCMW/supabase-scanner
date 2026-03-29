import { notFound, redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { GradeBadge } from "@/components/grade-badge";
import { FindingCard } from "@/components/finding-card";
import { ShareButton } from "@/components/share-button";
import { SocialShareRow } from "@/components/social-share-row";
import { GetBadgeButton } from "@/components/get-badge-button";
import type { Grade, Severity, FindingCategory, Finding } from "@/types/scanner";

interface FindingRow {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly severity: Severity;
  readonly category: FindingCategory;
  readonly resource: string;
  readonly details: Record<string, unknown>;
  readonly remediation: string;
  readonly module: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ScanDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: scanJob } = await supabase
    .from("scan_jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (!scanJob) {
    notFound();
  }

  const { data: findings } = await supabase
    .from("findings")
    .select("*")
    .eq("scan_job_id", id)
    .order("severity");

  const allFindings: readonly Finding[] = (findings ?? []).map(
    (f: FindingRow) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      severity: f.severity,
      category: f.category,
      resource: f.resource,
      details: f.details,
      remediation: f.remediation,
    }),
  );

  const criticalCount = allFindings.filter(
    (f) => f.severity === "critical",
  ).length;
  const highCount = allFindings.filter((f) => f.severity === "high").length;
  const mediumCount = allFindings.filter((f) => f.severity === "medium").length;
  const lowCount = allFindings.filter((f) => f.severity === "low").length;

  const moduleGroups = (findings ?? []).reduce<Record<string, FindingRow[]>>(
    (acc, f: FindingRow) => {
      const key = f.module;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(f);
      return acc;
    },
    {},
  );

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-sand-900">Scan Results</h1>
          <p className="text-sm text-sand-400">{scanJob.supabase_url}</p>
        </div>
        <div className="flex items-center gap-4">
          {scanJob.status === "completed" && scanJob.grade && (
            <>
              <GetBadgeButton scanJobId={id} />
              <ShareButton scanJobId={id} />
            </>
          )}
          <a
            href="/dashboard"
            className="text-sm text-sand-400 hover:text-sand-900 transition-colors"
          >
            Back to dashboard
          </a>
        </div>
      </header>

      {scanJob.grade && (
        <div className="flex items-center gap-8 p-6 bg-white border border-sand-200 rounded-xl mb-6">
          <GradeBadge grade={scanJob.grade as Grade} />
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatBox
              label="Critical"
              count={criticalCount}
              color="text-red-600"
            />
            <StatBox
              label="High"
              count={highCount}
              color="text-orange-600"
            />
            <StatBox
              label="Medium"
              count={mediumCount}
              color="text-amber-600"
            />
            <StatBox label="Low" count={lowCount} color="text-blue-600" />
          </div>
        </div>
      )}

      {scanJob.status === "completed" && scanJob.grade && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm font-medium text-sand-700">
            Share your grade
          </span>
          <SocialShareRow
            grade={scanJob.grade as string}
            totalFindings={scanJob.total_findings ?? 0}
            scanJobId={id}
          />
        </div>
      )}

      <p className="text-xs text-sand-400 mb-6">
        {scanJob.total_findings} finding
        {scanJob.total_findings !== 1 ? "s" : ""}
        {scanJob.duration_ms != null &&
          ` in ${(scanJob.duration_ms / 1000).toFixed(1)}s`}{" "}
        &middot; {new Date(scanJob.created_at).toLocaleString()}
      </p>

      {Object.entries(moduleGroups).map(([moduleName, moduleFindings]) => (
        <div key={moduleName} className="mb-8">
          <h3 className="text-base font-semibold mb-3 text-sand-900">
            {moduleName}
            <span className="text-sm font-normal text-sand-400 ml-2">
              ({moduleFindings.length} finding
              {moduleFindings.length !== 1 ? "s" : ""})
            </span>
          </h3>
          <div className="space-y-3">
            {moduleFindings.map((f) => (
              <FindingCard
                key={f.id}
                finding={{
                  id: f.id,
                  title: f.title,
                  description: f.description,
                  severity: f.severity,
                  category: f.category,
                  resource: f.resource,
                  details: f.details,
                  remediation: f.remediation,
                }}
              />
            ))}
          </div>
        </div>
      ))}

      {allFindings.length === 0 && scanJob.status === "completed" && (
        <p className="text-sand-400 text-sm text-center py-12">
          No security issues found. Your project looks well-configured.
        </p>
      )}

      {scanJob.status === "failed" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          Scan failed. Please try again.
        </div>
      )}
    </main>
  );
}

function StatBox({
  label,
  count,
  color,
}: {
  readonly label: string;
  readonly count: number;
  readonly color: string;
}) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-semibold ${color}`}>{count}</div>
      <div className="text-xs text-sand-400">{label}</div>
    </div>
  );
}
