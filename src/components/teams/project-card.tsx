"use client";

import { useState } from "react";
import { GradeBadge } from "@/components/grade-badge";
import type { Grade } from "@/types/scanner";

interface ProjectCardProps {
  readonly id: string;
  readonly teamId: string;
  readonly name: string;
  readonly supabaseUrl: string;
  readonly grade: string | null;
  readonly lastScanAt: string | null;
  readonly findings: {
    readonly critical: number;
    readonly high: number;
    readonly medium: number;
    readonly low: number;
  };
  readonly canScan: boolean;
}

export function ProjectCard({
  id,
  teamId,
  name,
  supabaseUrl,
  grade,
  lastScanAt,
  findings,
  canScan,
}: ProjectCardProps) {
  const [scanning, setScanning] = useState(false);

  async function handleScan() {
    setScanning(true);
    try {
      await fetch(`/api/teams/${teamId}/projects/${id}/scan`, {
        method: "POST",
      });
      window.location.reload();
    } catch {
      setScanning(false);
    }
  }

  const truncatedUrl =
    supabaseUrl.length > 40 ? `${supabaseUrl.slice(0, 37)}...` : supabaseUrl;

  return (
    <div className="p-4 bg-white border border-sand-200 rounded-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-sand-900 truncate">
            {name}
          </h4>
          <p className="text-xs text-sand-400 truncate mt-0.5" title={supabaseUrl}>
            {truncatedUrl}
          </p>
        </div>
        {grade && <GradeBadge grade={grade as Grade} size="sm" />}
      </div>

      {lastScanAt && (
        <p className="text-xs text-sand-400 mt-2">
          Last scan: {new Date(lastScanAt).toLocaleDateString()}
        </p>
      )}

      {grade && (
        <div className="flex gap-3 mt-2 text-xs">
          {findings.critical > 0 && (
            <span className="text-red-600 font-medium">
              {findings.critical} critical
            </span>
          )}
          {findings.high > 0 && (
            <span className="text-orange-600 font-medium">
              {findings.high} high
            </span>
          )}
          {findings.medium > 0 && (
            <span className="text-amber-600">{findings.medium} medium</span>
          )}
          {findings.low > 0 && (
            <span className="text-blue-600">{findings.low} low</span>
          )}
          {findings.critical === 0 &&
            findings.high === 0 &&
            findings.medium === 0 &&
            findings.low === 0 && (
              <span className="text-emerald-600">No findings</span>
            )}
        </div>
      )}

      {canScan && (
        <button
          type="button"
          onClick={handleScan}
          disabled={scanning}
          className="mt-3 px-3 py-1.5 text-xs font-medium bg-sand-900 hover:bg-sand-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {scanning ? "Scanning..." : "Scan Now"}
        </button>
      )}
    </div>
  );
}
