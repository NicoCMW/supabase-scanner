"use client";

import { useState } from "react";

interface DownloadReportButtonProps {
  readonly scanJobId: string;
  readonly isFreePlan: boolean;
}

type DownloadState = "idle" | "loading" | "error";

export function DownloadReportButton({
  scanJobId,
  isFreePlan,
}: DownloadReportButtonProps) {
  const [state, setState] = useState<DownloadState>("idle");

  async function handleDownload() {
    setState("loading");
    try {
      const res = await fetch(`/api/scan/${scanJobId}/report`);
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
          ?.match(/filename="(.+)"/)?.[1] ?? "supascanner-report.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="inline-flex flex-col items-start">
      <button
        onClick={handleDownload}
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
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {state === "loading"
          ? "Generating..."
          : isFreePlan
            ? "Download Summary"
            : "Download Report"}
      </button>
      {isFreePlan && (
        <span className="mt-1 text-xs text-sand-400">
          Upgrade to Pro for full report with remediation details
        </span>
      )}
      {state === "error" && (
        <span className="mt-1 text-xs text-red-600">
          Failed to generate report. Please try again.
        </span>
      )}
    </div>
  );
}
