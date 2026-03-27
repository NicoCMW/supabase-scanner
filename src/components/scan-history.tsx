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
        <p className="text-gray-400 text-lg mb-4">No scans yet</p>
        <a
          href="/scan"
          className="text-emerald-500 hover:text-emerald-400 font-medium"
        >
          Run your first scan
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-200">Scan History</h2>
      {scanJobs.map((job) => (
        <a
          key={job.id}
          href={`/scan/${job.id}`}
          className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg hover:bg-gray-800/80 transition-colors"
        >
          {job.grade ? (
            <GradeBadge grade={job.grade} size="sm" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
              {job.status === "running" ? "..." : "--"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-100 truncate">
              {job.supabase_url}
            </p>
            <p className="text-xs text-gray-500">
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
            <p className="text-sm text-gray-300">
              {job.total_findings} finding{job.total_findings !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-gray-500 capitalize">{job.status}</p>
          </div>
        </a>
      ))}
    </div>
  );
}
