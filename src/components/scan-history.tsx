import { GradeBadge } from "./grade-badge";
import type { Grade } from "@/types/scanner";

interface ScanJob {
  readonly id: string;
  readonly supabase_url: string;
  readonly status: string;
  readonly grade: Grade | null;
  readonly total_findings: number;
  readonly duration_ms: number | null;
  readonly created_at: string;
}

interface ScanHistoryProps {
  readonly scanJobs: readonly ScanJob[];
}

export function ScanHistory({ scanJobs }: ScanHistoryProps) {
  if (scanJobs.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sand-400 text-base mb-4">No scans yet</p>
        <a
          href="/scan"
          className="text-sand-900 hover:text-sand-600 font-medium text-sm underline underline-offset-2 transition-colors"
        >
          Run your first scan
        </a>
      </div>
    );
  }

  const completedJobs = scanJobs.filter(
    (j) => j.status === "completed" && j.grade != null,
  );

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-sand-900">Scan History</h2>
      {scanJobs.map((job, index) => {
        const prevCompleted = completedJobs.find((j) => {
          const jobDate = new Date(job.created_at).getTime();
          const jDate = new Date(j.created_at).getTime();
          return jDate < jobDate && j.supabase_url === job.supabase_url;
        });

        return (
          <div
            key={job.id}
            className="flex items-center gap-4 p-4 bg-white border border-sand-200 rounded-lg hover:border-sand-300 transition-colors"
          >
            <a
              href={`/scan/${job.id}`}
              className="flex items-center gap-4 flex-1 min-w-0"
            >
              {job.grade ? (
                <GradeBadge grade={job.grade} size="sm" />
              ) : (
                <div className="w-9 h-9 rounded-full border border-sand-200 flex items-center justify-center text-xs text-sand-400">
                  {job.status === "running" ? "..." : "--"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sand-900 truncate">
                  {job.supabase_url}
                </p>
                <p className="text-xs text-sand-400">
                  {new Date(job.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {job.duration_ms != null && (
                    <span> &middot; {(job.duration_ms / 1000).toFixed(1)}s</span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-sand-600">
                  {job.total_findings} finding
                  {job.total_findings !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-sand-400 capitalize">{job.status}</p>
              </div>
            </a>

            <div className="flex items-center gap-2 shrink-0">
              {prevCompleted && job.status === "completed" && (
                <a
                  href={`/dashboard/diff?from=${prevCompleted.id}&to=${job.id}`}
                  className="px-2 py-1 text-xs text-sand-500 border border-sand-200 rounded hover:border-sand-300 hover:text-sand-900 transition-colors"
                  title="Compare with previous scan"
                >
                  Diff
                </a>
              )}
              <a
                href={`/scan?url=${encodeURIComponent(job.supabase_url)}`}
                className="px-2 py-1 text-xs text-sand-500 border border-sand-200 rounded hover:border-sand-300 hover:text-sand-900 transition-colors"
                title="Re-scan this project"
              >
                Re-scan
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
