"use client";

import type { Grade, Finding } from "@/types/scanner";
import type { ScanModuleResult } from "@/types/scanner";
import { GradeBadge } from "./grade-badge";
import { FindingCard } from "./finding-card";

interface ScanResultsProps {
  readonly grade: Grade;
  readonly totalFindings: number;
  readonly modules: readonly ScanModuleResult[];
  readonly durationMs: number;
  readonly onReset: () => void;
}

export function ScanResults({
  grade,
  totalFindings,
  modules,
  durationMs,
  onReset,
}: ScanResultsProps) {
  const allFindings = modules.flatMap((m) => m.findings);
  const criticalCount = allFindings.filter((f) => f.severity === "critical").length;
  const highCount = allFindings.filter((f) => f.severity === "high").length;
  const mediumCount = allFindings.filter((f) => f.severity === "medium").length;
  const lowCount = allFindings.filter((f) => f.severity === "low").length;

  return (
    <div className="w-full max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Scan Results</h2>
        <button
          onClick={onReset}
          className="text-sm text-gray-400 hover:text-gray-200"
        >
          New Scan
        </button>
      </div>

      <div className="flex items-center gap-8 p-6 bg-gray-900 rounded-xl">
        <GradeBadge grade={grade} />
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatBox label="Critical" count={criticalCount} color="text-red-500" />
          <StatBox label="High" count={highCount} color="text-orange-500" />
          <StatBox label="Medium" count={mediumCount} color="text-yellow-500" />
          <StatBox label="Low" count={lowCount} color="text-blue-500" />
        </div>
      </div>

      <p className="text-xs text-gray-500">
        {totalFindings} finding{totalFindings !== 1 ? "s" : ""} in{" "}
        {(durationMs / 1000).toFixed(1)}s
      </p>

      {modules.map((mod) => (
        <div key={mod.module}>
          <h3 className="text-lg font-semibold mb-3 text-gray-200">
            {mod.module}
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({mod.findings.length} finding{mod.findings.length !== 1 ? "s" : ""})
            </span>
          </h3>
          <div className="space-y-3">
            {mod.findings.map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
            {mod.findings.length === 0 && (
              <p className="text-sm text-gray-500 italic">No issues found.</p>
            )}
          </div>
        </div>
      ))}
    </div>
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
      <div className={`text-2xl font-bold ${color}`}>{count}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
