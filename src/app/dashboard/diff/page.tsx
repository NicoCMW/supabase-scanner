import { redirect, notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { GradeBadge } from "@/components/grade-badge";
import { ScanSelector } from "@/components/scan-selector";
import { gradeToScore } from "@/lib/grade-score";
import type { Grade, Severity, FindingCategory } from "@/types/scanner";

interface FindingRow {
  readonly id: string;
  readonly title: string;
  readonly severity: Severity;
  readonly category: FindingCategory;
  readonly resource: string;
}

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

function findingKey(f: FindingRow): string {
  return `${f.title}::${f.category}::${f.resource}`;
}

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "text-red-600",
  high: "text-orange-600",
  medium: "text-amber-600",
  low: "text-blue-600",
};

const SEVERITIES: readonly Severity[] = ["critical", "high", "medium", "low"];

const CATEGORY_LABELS: Record<FindingCategory, string> = {
  rls: "Row Level Security",
  storage: "Storage",
  auth: "Authentication",
};

function countBySeverity(
  findings: readonly FindingRow[],
): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  for (const f of findings) {
    counts[f.severity] += 1;
  }
  return counts;
}

function countByCategory(
  findings: readonly FindingRow[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const f of findings) {
    counts[f.category] = (counts[f.category] ?? 0) + 1;
  }
  return counts;
}

export default async function DiffPage({ searchParams }: PageProps) {
  const { from, to } = await searchParams;
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: allScans } = await supabase
    .from("scan_jobs")
    .select("id, grade, supabase_url, total_findings, created_at")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(50);

  const scanOptions = (allScans ?? []) as readonly {
    id: string;
    grade: Grade | null;
    supabase_url: string;
    total_findings: number;
    created_at: string;
  }[];

  if (!from || !to) {
    return (
      <main className="min-h-screen p-8 max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold text-sand-900">
            Compare Scans
          </h1>
          <a
            href="/dashboard"
            className="text-sm text-sand-400 hover:text-sand-900 transition-colors"
          >
            Back to dashboard
          </a>
        </header>
        <ScanSelector scans={scanOptions} />
        {scanOptions.length < 2 && (
          <p className="text-sand-400 text-sm text-center mt-6">
            Run at least 2 scans to compare results.
          </p>
        )}
      </main>
    );
  }

  const [{ data: fromScan }, { data: toScan }] = await Promise.all([
    supabase.from("scan_jobs").select("*").eq("id", from).single(),
    supabase.from("scan_jobs").select("*").eq("id", to).single(),
  ]);

  if (!fromScan || !toScan) {
    notFound();
  }

  const [{ data: fromFindings }, { data: toFindings }] = await Promise.all([
    supabase
      .from("findings")
      .select("id, title, severity, category, resource")
      .eq("scan_job_id", from),
    supabase
      .from("findings")
      .select("id, title, severity, category, resource")
      .eq("scan_job_id", to),
  ]);

  const fromList = (fromFindings ?? []) as readonly FindingRow[];
  const toList = (toFindings ?? []) as readonly FindingRow[];

  const fromSet = new Set(fromList.map(findingKey));
  const toSet = new Set(toList.map(findingKey));

  const resolved = fromList
    .filter((f) => !toSet.has(findingKey(f)))
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const newFindings = toList
    .filter((f) => !fromSet.has(findingKey(f)))
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const unchanged = toList
    .filter((f) => fromSet.has(findingKey(f)))
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const fromGrade = fromScan.grade as Grade | null;
  const toGrade = toScan.grade as Grade | null;
  const fromScore = fromGrade ? gradeToScore(fromGrade) : null;
  const toScore = toGrade ? gradeToScore(toGrade) : null;

  const scoreDelta =
    fromScore != null && toScore != null ? toScore - fromScore : null;
  const trend =
    scoreDelta != null
      ? scoreDelta > 0
        ? "improving"
        : scoreDelta < 0
          ? "declining"
          : "stable"
      : null;

  const trendConfig = {
    improving: {
      label: "Improving",
      arrow: "\u2191",
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-200",
    },
    declining: {
      label: "Declining",
      arrow: "\u2193",
      color: "text-red-600",
      bg: "bg-red-50 border-red-200",
    },
    stable: {
      label: "No Change",
      arrow: "\u2192",
      color: "text-sand-600",
      bg: "bg-sand-50 border-sand-200",
    },
  } as const;

  const fromSevCounts = countBySeverity(fromList);
  const toSevCounts = countBySeverity(toList);
  const fromCatCounts = countByCategory(fromList);
  const toCatCounts = countByCategory(toList);

  const allCategories = [
    ...new Set([...Object.keys(fromCatCounts), ...Object.keys(toCatCounts)]),
  ] as FindingCategory[];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold text-sand-900">
          Scan Comparison
        </h1>
        <a
          href="/dashboard"
          className="text-sm text-sand-400 hover:text-sand-900 transition-colors"
        >
          Back to dashboard
        </a>
      </header>

      {/* Scan selector for picking different scans */}
      <div className="mb-6">
        <ScanSelector scans={scanOptions} fromId={from} toId={to} />
      </div>

      {/* Score trend banner */}
      {trend && (
        <div
          className={`flex items-center gap-3 p-4 border rounded-lg mb-6 ${trendConfig[trend].bg}`}
        >
          <span className={`text-2xl ${trendConfig[trend].color}`}>
            {trendConfig[trend].arrow}
          </span>
          <div>
            <p
              className={`text-sm font-semibold ${trendConfig[trend].color}`}
            >
              Security {trendConfig[trend].label}
            </p>
            <p className="text-xs text-sand-500">
              Score: {fromScore} → {toScore}
              {scoreDelta !== 0 && (
                <span className={trendConfig[trend].color}>
                  {" "}
                  ({scoreDelta! > 0 ? "+" : ""}
                  {scoreDelta} pts)
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Side-by-side scan cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-white border border-sand-200 rounded-lg">
          <p className="text-xs text-sand-400 mb-2">Previous</p>
          <div className="flex items-center gap-3">
            {fromGrade && <GradeBadge grade={fromGrade} size="sm" />}
            <div>
              <p className="text-sm font-medium text-sand-900">
                {fromScan.total_findings} findings
              </p>
              <p className="text-xs text-sand-400">
                {formatDate(fromScan.created_at)}
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white border border-sand-200 rounded-lg">
          <p className="text-xs text-sand-400 mb-2">Latest</p>
          <div className="flex items-center gap-3">
            {toGrade && <GradeBadge grade={toGrade} size="sm" />}
            <div>
              <p className="text-sm font-medium text-sand-900">
                {toScan.total_findings} findings
              </p>
              <p className="text-xs text-sand-400">
                {formatDate(toScan.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Severity breakdown comparison */}
      <div className="p-4 bg-white border border-sand-200 rounded-lg mb-6">
        <p className="text-sm font-medium text-sand-900 mb-3">
          Severity Breakdown
        </p>
        <div className="grid grid-cols-4 gap-3">
          {SEVERITIES.map((sev) => {
            const fromCount = fromSevCounts[sev];
            const toCount = toSevCounts[sev];
            const delta = toCount - fromCount;
            return (
              <div key={sev} className="text-center">
                <p
                  className={`text-xs font-medium uppercase mb-1 ${SEVERITY_COLORS[sev]}`}
                >
                  {sev}
                </p>
                <p className="text-lg font-semibold text-sand-900">
                  {fromCount} → {toCount}
                </p>
                {delta !== 0 && (
                  <p
                    className={`text-xs font-medium ${delta < 0 ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {delta < 0 ? delta : `+${delta}`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Category breakdown */}
      {allCategories.length > 0 && (
        <div className="p-4 bg-white border border-sand-200 rounded-lg mb-6">
          <p className="text-sm font-medium text-sand-900 mb-3">
            By Category
          </p>
          <div className="space-y-2">
            {allCategories.map((cat) => {
              const fromCount = fromCatCounts[cat] ?? 0;
              const toCount = toCatCounts[cat] ?? 0;
              const delta = toCount - fromCount;
              return (
                <div
                  key={cat}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-sand-700">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </span>
                  <span className="text-sand-900 font-medium">
                    {fromCount} → {toCount}
                    {delta !== 0 && (
                      <span
                        className={`ml-2 text-xs ${delta < 0 ? "text-emerald-600" : "text-red-600"}`}
                      >
                        ({delta < 0 ? delta : `+${delta}`})
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary badges */}
      <div className="flex gap-4 mb-8 text-sm">
        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded">
          {resolved.length} resolved
        </span>
        <span className="px-2 py-1 bg-red-50 text-red-700 rounded">
          {newFindings.length} new
        </span>
        <span className="px-2 py-1 bg-sand-100 text-sand-600 rounded">
          {unchanged.length} unchanged
        </span>
      </div>

      {/* Resolved findings */}
      {resolved.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-semibold text-emerald-700 mb-3">
            Resolved
          </h2>
          <div className="space-y-2">
            {resolved.map((f: FindingRow) => (
              <div
                key={f.id}
                className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg"
              >
                <span
                  className={`text-xs font-medium uppercase ${SEVERITY_COLORS[f.severity]}`}
                >
                  {f.severity}
                </span>
                <span className="text-sm text-sand-900">{f.title}</span>
                <span className="text-xs text-sand-400 ml-auto">
                  {f.resource}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* New findings */}
      {newFindings.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-semibold text-red-700 mb-3">
            New Findings
          </h2>
          <div className="space-y-2">
            {newFindings.map((f: FindingRow) => (
              <div
                key={f.id}
                className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg"
              >
                <span
                  className={`text-xs font-medium uppercase ${SEVERITY_COLORS[f.severity]}`}
                >
                  {f.severity}
                </span>
                <span className="text-sm text-sand-900">{f.title}</span>
                <span className="text-xs text-sand-400 ml-auto">
                  {f.resource}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Unchanged findings */}
      {unchanged.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-semibold text-sand-600 mb-3">
            Unchanged
          </h2>
          <div className="space-y-2">
            {unchanged.map((f: FindingRow) => (
              <div
                key={f.id}
                className="flex items-center gap-3 p-3 bg-sand-50 border border-sand-200 rounded-lg"
              >
                <span
                  className={`text-xs font-medium uppercase ${SEVERITY_COLORS[f.severity]}`}
                >
                  {f.severity}
                </span>
                <span className="text-sm text-sand-900">{f.title}</span>
                <span className="text-xs text-sand-400 ml-auto">
                  {f.resource}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {resolved.length === 0 && newFindings.length === 0 && (
        <p className="text-sand-400 text-sm text-center py-8">
          No changes between these two scans.
        </p>
      )}
    </main>
  );
}
