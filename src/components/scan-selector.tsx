"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Grade } from "@/types/scanner";

interface ScanOption {
  readonly id: string;
  readonly grade: Grade | null;
  readonly supabase_url: string;
  readonly total_findings: number;
  readonly created_at: string;
}

interface ScanSelectorProps {
  readonly scans: readonly ScanOption[];
  readonly fromId?: string;
  readonly toId?: string;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ScanSelector({ scans, fromId, toId }: ScanSelectorProps) {
  const router = useRouter();
  const [from, setFrom] = useState(fromId ?? "");
  const [to, setTo] = useState(toId ?? "");

  const canCompare = from !== "" && to !== "" && from !== to;

  function handleCompare() {
    if (canCompare) {
      router.push(`/dashboard/diff?from=${from}&to=${to}`);
    }
  }

  return (
    <div className="p-4 bg-white border border-sand-200 rounded-lg">
      <p className="text-sm font-medium text-sand-900 mb-3">Compare Scans</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label htmlFor="scan-from" className="text-xs text-sand-400 mb-1 block">
            Previous scan
          </label>
          <select
            id="scan-from"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-sand-200 rounded-lg bg-white text-sand-900 focus:outline-none focus:ring-1 focus:ring-sand-400"
          >
            <option value="">Select a scan...</option>
            {scans.map((s) => (
              <option key={s.id} value={s.id} disabled={s.id === to}>
                {s.grade ?? "--"} - {formatDate(s.created_at)} - {s.total_findings} findings
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="scan-to" className="text-xs text-sand-400 mb-1 block">
            Latest scan
          </label>
          <select
            id="scan-to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-sand-200 rounded-lg bg-white text-sand-900 focus:outline-none focus:ring-1 focus:ring-sand-400"
          >
            <option value="">Select a scan...</option>
            {scans.map((s) => (
              <option key={s.id} value={s.id} disabled={s.id === from}>
                {s.grade ?? "--"} - {formatDate(s.created_at)} - {s.total_findings} findings
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={handleCompare}
        disabled={!canCompare}
        className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-sand-900 hover:bg-sand-700 text-white"
      >
        Compare
      </button>
    </div>
  );
}
