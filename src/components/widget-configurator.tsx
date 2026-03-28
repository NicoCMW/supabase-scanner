"use client";

import { useState, useCallback } from "react";
import type { Grade } from "@/types/scanner";

interface SharedResult {
  readonly share_id: string;
  readonly grade: Grade;
  readonly scan_date: string;
  readonly total_findings: number;
}

interface WidgetConfiguratorProps {
  readonly sharedResults: readonly SharedResult[];
}

const WIDGET_HOST = "https://supabase-scanner.vercel.app";

const GRADE_COLORS: Record<Grade, string> = {
  A: "bg-emerald-100 text-emerald-700 border-emerald-200",
  B: "bg-lime-100 text-lime-700 border-lime-200",
  C: "bg-amber-100 text-amber-700 border-amber-200",
  D: "bg-orange-100 text-orange-700 border-orange-200",
  F: "bg-red-100 text-red-700 border-red-200",
};

type Theme = "light" | "dark" | "auto";
type Size = "compact" | "full";

export function WidgetConfigurator({
  sharedResults,
}: WidgetConfiguratorProps) {
  const [selectedId, setSelectedId] = useState(sharedResults[0]?.share_id ?? "");
  const [theme, setTheme] = useState<Theme>("auto");
  const [size, setSize] = useState<Size>("full");
  const [showFindings, setShowFindings] = useState(true);
  const [copied, setCopied] = useState(false);

  const snippet = buildSnippet(selectedId, theme, size, showFindings);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [snippet]);

  const selectedResult = sharedResults.find((r) => r.share_id === selectedId);

  return (
    <div className="space-y-6">
      {/* Scan selector */}
      <section className="border border-sand-200 rounded-xl p-4">
        <label className="block text-sm font-medium text-sand-700 mb-2">
          Select scan to embed
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full border border-sand-200 rounded-lg px-3 py-2 text-sm text-sand-900 bg-white focus:outline-none focus:ring-2 focus:ring-sand-900/10 focus:border-sand-300"
        >
          {sharedResults.map((r) => (
            <option key={r.share_id} value={r.share_id}>
              Grade {r.grade} — {formatDate(r.scan_date)} — {r.total_findings}{" "}
              findings
            </option>
          ))}
        </select>
      </section>

      {/* Configuration */}
      <section className="border border-sand-200 rounded-xl p-4 space-y-4">
        <h2 className="text-sm font-medium text-sand-700">Configuration</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-sand-500 mb-1">Theme</label>
            <div className="flex gap-1">
              {(["auto", "light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`flex-1 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    theme === t
                      ? "border-sand-900 bg-sand-900 text-white"
                      : "border-sand-200 text-sand-600 hover:border-sand-300"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-sand-500 mb-1">Size</label>
            <div className="flex gap-1">
              {(["full", "compact"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`flex-1 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    size === s
                      ? "border-sand-900 bg-sand-900 text-white"
                      : "border-sand-200 text-sand-600 hover:border-sand-300"
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-sand-500 mb-1">
              Show findings
            </label>
            <button
              type="button"
              onClick={() => setShowFindings((v) => !v)}
              className={`w-full px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                showFindings
                  ? "border-sand-900 bg-sand-900 text-white"
                  : "border-sand-200 text-sand-600 hover:border-sand-300"
              }`}
            >
              {showFindings ? "Shown" : "Hidden"}
            </button>
          </div>
        </div>
      </section>

      {/* Live preview */}
      <section className="border border-sand-200 rounded-xl p-4">
        <h2 className="text-sm font-medium text-sand-700 mb-3">
          Live Preview
        </h2>
        <div
          className={`rounded-lg p-6 flex justify-center ${
            theme === "dark"
              ? "bg-sand-800"
              : theme === "light"
                ? "bg-white border border-sand-100"
                : "bg-sand-50"
          }`}
        >
          {selectedResult && (
            <WidgetPreview
              result={selectedResult}
              theme={theme === "auto" ? "light" : theme}
              size={size}
              showFindings={showFindings}
            />
          )}
        </div>
      </section>

      {/* Code snippet */}
      <section className="border border-sand-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-sand-700">Embed Code</h2>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-sand-200 text-sand-600 hover:border-sand-300 hover:text-sand-900 transition-colors"
          >
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>
        </div>
        <pre className="bg-sand-50 border border-sand-200 rounded-lg p-3 text-xs text-sand-700 overflow-x-auto whitespace-pre-wrap break-all">
          {snippet}
        </pre>
      </section>
    </div>
  );
}

function WidgetPreview({
  result,
  theme,
  size,
  showFindings,
}: {
  readonly result: SharedResult;
  readonly theme: "light" | "dark";
  readonly size: Size;
  readonly showFindings: boolean;
}) {
  const isDark = theme === "dark";
  const isCompact = size === "compact";
  const gradeColors = getPreviewGradeColors(result.grade);

  return (
    <div
      className="rounded-xl border p-4 min-w-[200px] max-w-[360px]"
      style={{
        background: isDark ? "#1c1917" : "#ffffff",
        color: isDark ? "#faf9f7" : "#1c1917",
        borderColor: isDark ? "#44403c" : "#e8e5e0",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`${isCompact ? "w-8 h-8 text-base" : "w-12 h-12 text-xl"} rounded-full flex items-center justify-center font-semibold border-2 flex-shrink-0`}
          style={{
            background: gradeColors.bg,
            color: gradeColors.text,
            borderColor: gradeColors.border,
          }}
        >
          {result.grade}
        </div>
        {!isCompact && (
          <div>
            <p className="text-sm font-semibold">{gradeLabel(result.grade)}</p>
            <p
              className="text-xs"
              style={{ color: isDark ? "#a8a29e" : "#78716c" }}
            >
              Scanned {formatDate(result.scan_date)}
            </p>
          </div>
        )}
      </div>

      {showFindings && !isCompact && result.total_findings > 0 && (
        <div
          className="mt-3 pt-3"
          style={{
            borderTop: `1px solid ${isDark ? "#44403c" : "#e8e5e0"}`,
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-2"
            style={{ color: isDark ? "#a8a29e" : "#78716c" }}
          >
            Findings
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: "#b91c1c" }}>
              {result.total_findings} total
            </span>
          </div>
        </div>
      )}

      <div className="mt-3 text-right">
        <span
          className="text-[11px]"
          style={{ color: isDark ? "#a8a29e" : "#78716c" }}
        >
          Secured by SupaScanner
        </span>
      </div>
    </div>
  );
}

function buildSnippet(
  projectId: string,
  theme: Theme,
  size: Size,
  showFindings: boolean,
): string {
  const attrs = [`data-project="${projectId}"`];

  if (theme !== "auto") {
    attrs.push(`data-theme="${theme}"`);
  }
  if (size !== "full") {
    attrs.push(`data-size="${size}"`);
  }
  if (!showFindings) {
    attrs.push(`data-show-findings="false"`);
  }

  return `<script src="${WIDGET_HOST}/widget.js" ${attrs.join(" ")}></script>`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function gradeLabel(grade: Grade): string {
  const labels: Record<Grade, string> = {
    A: "Excellent",
    B: "Good",
    C: "Needs Improvement",
    D: "Poor",
    F: "Critical",
  };
  return labels[grade];
}

function getPreviewGradeColors(grade: Grade) {
  const map: Record<Grade, { bg: string; text: string; border: string }> = {
    A: { bg: "#d1fae5", text: "#047857", border: "#a7f3d0" },
    B: { bg: "#ecfccb", text: "#4d7c0f", border: "#d9f99d" },
    C: { bg: "#fef3c7", text: "#a16207", border: "#fde68a" },
    D: { bg: "#ffedd5", text: "#c2410c", border: "#fed7aa" },
    F: { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" },
  };
  return map[grade];
}
