import { gradeToScore } from "@/lib/grade-score";
import { GradeBadge } from "./grade-badge";
import type { Grade } from "@/types/scanner";

interface ScanJob {
  readonly id: string;
  readonly grade: Grade;
  readonly total_findings: number;
  readonly created_at: string;
}

interface DashboardStatsProps {
  readonly scanJobs: readonly ScanJob[];
}

export function DashboardStats({ scanJobs }: DashboardStatsProps) {
  const latestGrade = scanJobs[0]?.grade;
  const totalScans = scanJobs.length;
  const avgScore = Math.round(
    scanJobs.reduce((sum, j) => sum + gradeToScore(j.grade), 0) / totalScans,
  );
  const totalFindings = scanJobs.reduce((sum, j) => sum + j.total_findings, 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="p-4 bg-white border border-sand-200 rounded-lg text-center">
        {latestGrade && <GradeBadge grade={latestGrade} size="sm" />}
        <p className="text-xs text-sand-400 mt-1">Latest Grade</p>
      </div>
      <div className="p-4 bg-white border border-sand-200 rounded-lg text-center">
        <p className="text-2xl font-semibold text-sand-900">{totalScans}</p>
        <p className="text-xs text-sand-400">Total Scans</p>
      </div>
      <div className="p-4 bg-white border border-sand-200 rounded-lg text-center">
        <p className="text-2xl font-semibold text-sand-900">{avgScore}</p>
        <p className="text-xs text-sand-400">Avg Score</p>
      </div>
      <div className="p-4 bg-white border border-sand-200 rounded-lg text-center">
        <p className="text-2xl font-semibold text-sand-900">{totalFindings}</p>
        <p className="text-xs text-sand-400">Total Findings</p>
      </div>
    </div>
  );
}
