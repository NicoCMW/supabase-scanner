"use client";

import { useState } from "react";

interface ComplianceReportButtonProps {
  readonly scanJobId: string;
  readonly isPro: boolean;
}

type DownloadState = "idle" | "loading" | "error";

type ComplianceFramework = "soc2" | "hipaa" | "executive";

const FRAMEWORK_LABELS: Record<ComplianceFramework, string> = {
  soc2: "SOC 2 Readiness",
  hipaa: "HIPAA Checklist",
  executive: "Executive Summary",
};

export function ComplianceReportButton({
  scanJobId,
  isPro,
}: ComplianceReportButtonProps) {
  const [state, setState] = useState<DownloadState>("idle");
  const [isOpen, setIsOpen] = useState(false);

  async function handleDownload(framework: ComplianceFramework) {
    setIsOpen(false);
    setState("loading");
    try {
      const res = await fetch(
        `/api/scan/${scanJobId}/compliance?framework=${framework}`,
      );
      if (!res.ok) {
        setState("error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] ??
        `supascanner-${framework}-report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  if (!isPro) {
    return (
      <div className="inline-flex flex-col items-start">
        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sand-400 bg-sand-50 border border-sand-200 rounded-lg cursor-not-allowed"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Compliance Reports
        </button>
        <span className="mt-1 text-xs text-sand-400">
          Pro feature — SOC 2, HIPAA, and executive compliance reports
        </span>
      </div>
    );
  }

  return (
    <div className="relative inline-flex flex-col items-start">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={state === "loading"}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sand-700 bg-white border border-sand-200 rounded-lg hover:bg-sand-50 transition-colors disabled:opacity-50"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {state === "loading" ? "Generating..." : "Compliance Reports"}
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-sand-200 rounded-lg shadow-lg z-10">
          {(
            Object.entries(FRAMEWORK_LABELS) as [ComplianceFramework, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleDownload(key)}
              className="w-full text-left px-4 py-2.5 text-sm text-sand-700 hover:bg-sand-50 first:rounded-t-lg last:rounded-b-lg transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {state === "error" && (
        <span className="mt-1 text-xs text-red-600">
          Failed to generate report. Please try again.
        </span>
      )}
    </div>
  );
}
