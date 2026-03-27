import { redirect, notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { GradeBadge } from "@/components/grade-badge";
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

export default async function DiffPage({ searchParams }: PageProps) {
  const { from, to } = await searchParams;
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!from || !to) {
    return (
      <main className="min-h-screen p-8 max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold text-sand-900 mb-4">
          Compare Scans
        </h1>
        <p className="text-sand-400 text-sm">
          Select two scans from your{" "}
          <a href="/dashboard" className="underline hover:text-sand-900">
            dashboard
          </a>{" "}
          to compare.
        </p>
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

  const fromSet = new Set((fromFindings ?? []).map(findingKey));
  const toSet = new Set((toFindings ?? []).map(findingKey));

  const resolved = (fromFindings ?? [])
    .filter((f: FindingRow) => !toSet.has(findingKey(f)))
    .sort((a: FindingRow, b: FindingRow) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const newFindings = (toFindings ?? [])
    .filter((f: FindingRow) => !fromSet.has(findingKey(f)))
    .sort((a: FindingRow, b: FindingRow) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const unchanged = (toFindings ?? [])
    .filter((f: FindingRow) => fromSet.has(findingKey(f)))
    .sort((a: FindingRow, b: FindingRow) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold text-sand-900">Scan Comparison</h1>
        <a
          href="/dashboard"
          className="text-sm text-sand-400 hover:text-sand-900 transition-colors"
        >
          Back to dashboard
        </a>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-white border border-sand-200 rounded-lg">
          <p className="text-xs text-sand-400 mb-2">Previous</p>
          <div className="flex items-center gap-3">
            {fromScan.grade && (
              <GradeBadge grade={fromScan.grade as Grade} size="sm" />
            )}
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
            {toScan.grade && (
              <GradeBadge grade={toScan.grade as Grade} size="sm" />
            )}
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
