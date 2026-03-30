"use client";

import { useCallback, useState } from "react";
import type { Grade } from "@/types/scanner";
import type { ScanModuleResult } from "@/types/scanner";
import { GradeBadge } from "./grade-badge";
import { FindingCard } from "./finding-card";

interface ScanResultsProps {
  readonly grade: Grade;
  readonly totalFindings: number;
  readonly modules: readonly ScanModuleResult[];
  readonly durationMs: number;
  readonly onReset: () => void;
  readonly cached?: boolean;
  readonly cacheAgeSeconds?: number;
  readonly onRescan?: () => void;
  readonly isPro?: boolean;
}

function formatCacheAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

export function ScanResults({
  grade,
  totalFindings,
  modules,
  durationMs,
  onReset,
  cached,
  cacheAgeSeconds,
  onRescan,
  isPro,
}: ScanResultsProps) {
  const allFindings = modules.flatMap((m) => m.findings);
  const criticalCount = allFindings.filter(
    (f) => f.severity === "critical",
  ).length;
  const highCount = allFindings.filter((f) => f.severity === "high").length;
  const mediumCount = allFindings.filter((f) => f.severity === "medium").length;
  const lowCount = allFindings.filter((f) => f.severity === "low").length;

  const [snippetsUsed, setSnippetsUsed] = useState(0);

  const handleSnippetUse = useCallback((count: number) => {
    setSnippetsUsed((prev) => prev + count);
  }, []);

  return (
    <div className="w-full max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-sand-900">Scan Results</h2>
        <button
          onClick={onReset}
          className="text-sm text-sand-400 hover:text-sand-900 transition-colors"
        >
          New scan
        </button>
      </div>

      <div className="flex items-center gap-8 p-6 bg-white border border-sand-200 rounded-xl">
        <GradeBadge grade={grade} />
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatBox label="Critical" count={criticalCount} color="text-red-600" />
          <StatBox label="High" count={highCount} color="text-orange-600" />
          <StatBox label="Medium" count={mediumCount} color="text-amber-600" />
          <StatBox label="Low" count={lowCount} color="text-blue-600" />
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-sand-400">
        <p>
          {totalFindings} finding{totalFindings !== 1 ? "s" : ""} in{" "}
          {(durationMs / 1000).toFixed(1)}s
        </p>
        {cached && cacheAgeSeconds != null && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-sand-100 border border-sand-200 rounded text-sand-500">
            Scanned {formatCacheAge(cacheAgeSeconds)}
            {onRescan && (
              <button
                onClick={onRescan}
                className="text-sand-600 hover:text-sand-900 underline underline-offset-2 transition-colors"
              >
                Rescan
              </button>
            )}
          </span>
        )}
      </div>

      {modules.map((mod) => (
        <div key={mod.module}>
          <h3 className="text-base font-semibold mb-3 text-sand-900">
            {mod.module}
            <span className="text-sm font-normal text-sand-400 ml-2">
              ({mod.findings.length} finding
              {mod.findings.length !== 1 ? "s" : ""})
            </span>
          </h3>
          <div className="space-y-3">
            {mod.findings.map((finding) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                isPro={isPro}
                snippetsBudget={{
                  used: snippetsUsed,
                  onUse: handleSnippetUse,
                }}
              />
            ))}
            {mod.findings.length === 0 && (
              <p className="text-sm text-sand-400">No issues found.</p>
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
      <div className={`text-2xl font-semibold ${color}`}>{count}</div>
      <div className="text-xs text-sand-400">{label}</div>
    </div>
  );
}
