"use client";

import { useState } from "react";
import type { Finding } from "@/types/scanner";

const SEVERITY_COLORS = {
  critical: "border-red-600 bg-red-950/50",
  high: "border-orange-500 bg-orange-950/50",
  medium: "border-yellow-500 bg-yellow-950/50",
  low: "border-blue-500 bg-blue-950/50",
} as const;

const SEVERITY_BADGES = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-gray-900",
  low: "bg-blue-500 text-white",
} as const;

interface FindingCardProps {
  readonly finding: Finding;
}

export function FindingCard({ finding }: FindingCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border-l-4 rounded-r-lg p-4 ${SEVERITY_COLORS[finding.severity]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${SEVERITY_BADGES[finding.severity]}`}
            >
              {finding.severity.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">{finding.category.toUpperCase()}</span>
          </div>
          <h3 className="font-medium text-gray-100">{finding.title}</h3>
          <p className="text-sm text-gray-400 mt-1">{finding.description}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-400 hover:text-gray-200 shrink-0"
        >
          {expanded ? "Hide fix" : "Show fix"}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <h4 className="text-sm font-medium text-gray-300 mb-1">
            Remediation
          </h4>
          <p className="text-sm text-gray-400">{finding.remediation}</p>
          <code className="block mt-2 p-2 bg-gray-900 rounded text-xs text-emerald-400 font-mono whitespace-pre-wrap">
            {finding.remediation}
          </code>
        </div>
      )}
    </div>
  );
}
