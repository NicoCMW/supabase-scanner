"use client";

import { useState } from "react";
import type { Finding } from "@/types/scanner";

const SEVERITY_COLORS = {
  critical: "border-l-red-500 bg-red-50",
  high: "border-l-orange-500 bg-orange-50",
  medium: "border-l-amber-500 bg-amber-50",
  low: "border-l-blue-500 bg-blue-50",
} as const;

const SEVERITY_BADGES = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-blue-100 text-blue-700",
} as const;

interface FindingCardProps {
  readonly finding: Finding;
}

export function FindingCard({ finding }: FindingCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border-l-4 border border-sand-200 rounded-lg p-4 ${SEVERITY_COLORS[finding.severity]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${SEVERITY_BADGES[finding.severity]}`}
            >
              {finding.severity.toUpperCase()}
            </span>
            <span className="text-xs text-sand-400">
              {finding.category.toUpperCase()}
            </span>
          </div>
          <h3 className="font-medium text-sand-900">{finding.title}</h3>
          <p className="text-sm text-sand-500 mt-1">{finding.description}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-sand-400 hover:text-sand-900 shrink-0 transition-colors"
        >
          {expanded ? "Hide fix" : "Show fix"}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-sand-200">
          <h4 className="text-sm font-medium text-sand-700 mb-1">
            Remediation
          </h4>
          <p className="text-sm text-sand-500">{finding.remediation}</p>
          <code className="block mt-2 p-3 bg-sand-900 rounded-lg text-xs text-sand-100 font-mono whitespace-pre-wrap">
            {finding.remediation}
          </code>
        </div>
      )}
    </div>
  );
}
