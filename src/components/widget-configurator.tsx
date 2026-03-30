"use client";

import { useState, useCallback, useMemo } from "react";
import type { Grade } from "@/types/scanner";
import type { BadgeStyle } from "@/lib/badge";

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

type Theme = "light" | "dark" | "auto";
type Size = "compact" | "full";
type EmbedTab = "badge" | "widget";
type CopiedKey = "markdown" | "html" | "url" | "widget" | null;

const BADGE_STYLE_OPTIONS: readonly { readonly value: BadgeStyle; readonly label: string }[] = [
  { value: "flat", label: "Flat" },
  { value: "flat-square", label: "Flat Square" },
];

const BADGE_LABEL_PRESETS: readonly { readonly value: string; readonly label: string }[] = [
  { value: "SupaScanner", label: "SupaScanner (default)" },
  { value: "Secured by SupaScanner", label: "Secured by SupaScanner" },
  { value: "Security", label: "Security" },
];

function buildBadgeUrl(
  origin: string,
  shareId: string,
  style: BadgeStyle,
  label: string,
): string {
  const params = new URLSearchParams();
  if (style !== "flat") params.set("style", style);
  if (label !== "SupaScanner") params.set("label", label);
  const qs = params.toString();
  return `${origin}/api/badge/${shareId}${qs ? `?${qs}` : ""}`;
}

function buildResultsUrl(origin: string, shareId: string): string {
  return `${origin}/results/${shareId}`;
}

function buildWidgetSnippet(
  projectId: string,
  theme: Theme,
  size: Size,
  showFindings: boolean,
): string {
  const attrs = [`data-project="${projectId}"`];
  if (theme !== "auto") attrs.push(`data-theme="${theme}"`);
  if (size !== "full") attrs.push(`data-size="${size}"`);
  if (!showFindings) attrs.push(`data-show-findings="false"`);
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

export function WidgetConfigurator({
  sharedResults,
}: WidgetConfiguratorProps) {
  const [tab, setTab] = useState<EmbedTab>("badge");
  const [selectedId, setSelectedId] = useState(sharedResults[0]?.share_id ?? "");

  // Badge state
  const [badgeStyle, setBadgeStyle] = useState<BadgeStyle>("flat");
  const [badgeLabel, setBadgeLabel] = useState("SupaScanner");
  const [customLabel, setCustomLabel] = useState("");
  const [useCustomLabel, setUseCustomLabel] = useState(false);

  // Widget state
  const [theme, setTheme] = useState<Theme>("auto");
  const [size, setSize] = useState<Size>("full");
  const [showFindings, setShowFindings] = useState(true);

  const [copied, setCopied] = useState<CopiedKey>(null);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : WIDGET_HOST;

  const selectedResult = sharedResults.find((r) => r.share_id === selectedId);
  const activeBadgeLabel = useCustomLabel ? customLabel : badgeLabel;

  const badgeUrl = useMemo(
    () => buildBadgeUrl(origin, selectedId, badgeStyle, activeBadgeLabel),
    [origin, selectedId, badgeStyle, activeBadgeLabel],
  );

  const resultsUrl = useMemo(
    () => buildResultsUrl(origin, selectedId),
    [origin, selectedId],
  );

  const markdownSnippet = `[![${activeBadgeLabel} Grade](${badgeUrl})](${resultsUrl})`;
  const htmlSnippet = `<a href="${resultsUrl}"><img src="${badgeUrl}" alt="${activeBadgeLabel} Security Grade" /></a>`;
  const widgetSnippet = buildWidgetSnippet(selectedId, theme, size, showFindings);

  const handleCopy = useCallback(async (text: string, key: CopiedKey) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  return (
    <div className="space-y-6">
      {/* Tab selector */}
      <div className="flex gap-1 border border-sand-200 rounded-lg p-1 bg-sand-50">
        {(["badge", "widget"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t
                ? "bg-white text-sand-900 shadow-sm"
                : "text-sand-500 hover:text-sand-700"
            }`}
          >
            {t === "badge" ? "README Badge" : "Embed Widget"}
          </button>
        ))}
      </div>

      {/* Scan selector (shared) */}
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
              Grade {r.grade} -- {formatDate(r.scan_date)} -- {r.total_findings}{" "}
              findings
            </option>
          ))}
        </select>
      </section>

      {tab === "badge" ? (
        <BadgeConfigurator
          badgeUrl={badgeUrl}
          markdownSnippet={markdownSnippet}
          htmlSnippet={htmlSnippet}
          badgeStyle={badgeStyle}
          onStyleChange={setBadgeStyle}
          badgeLabel={badgeLabel}
          onLabelChange={setBadgeLabel}
          customLabel={customLabel}
          onCustomLabelChange={setCustomLabel}
          useCustomLabel={useCustomLabel}
          onToggleCustomLabel={setUseCustomLabel}
          copied={copied}
          onCopy={handleCopy}
        />
      ) : (
        <WidgetEmbedConfigurator
          selectedResult={selectedResult ?? null}
          widgetSnippet={widgetSnippet}
          theme={theme}
          onThemeChange={setTheme}
          size={size}
          onSizeChange={setSize}
          showFindings={showFindings}
          onShowFindingsChange={setShowFindings}
          copied={copied === "widget"}
          onCopy={() => handleCopy(widgetSnippet, "widget")}
        />
      )}
    </div>
  );
}

/* ── Badge Tab ──────────────────────────────────────────────────────── */

function BadgeConfigurator({
  badgeUrl,
  markdownSnippet,
  htmlSnippet,
  badgeStyle,
  onStyleChange,
  badgeLabel,
  onLabelChange,
  customLabel,
  onCustomLabelChange,
  useCustomLabel,
  onToggleCustomLabel,
  copied,
  onCopy,
}: {
  readonly badgeUrl: string;
  readonly markdownSnippet: string;
  readonly htmlSnippet: string;
  readonly badgeStyle: BadgeStyle;
  readonly onStyleChange: (s: BadgeStyle) => void;
  readonly badgeLabel: string;
  readonly onLabelChange: (l: string) => void;
  readonly customLabel: string;
  readonly onCustomLabelChange: (l: string) => void;
  readonly useCustomLabel: boolean;
  readonly onToggleCustomLabel: (v: boolean) => void;
  readonly copied: CopiedKey;
  readonly onCopy: (text: string, key: CopiedKey) => void;
}) {
  return (
    <>
      {/* Badge preview + controls */}
      <section className="border border-sand-200 rounded-xl p-4 space-y-4">
        <h2 className="text-sm font-medium text-sand-700">Badge Preview</h2>
        <div className="flex justify-center p-4 bg-sand-50 rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={badgeUrl} alt="Badge preview" key={badgeUrl} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-sand-500 mb-1">Style</label>
            <select
              value={badgeStyle}
              onChange={(e) => onStyleChange(e.target.value as BadgeStyle)}
              className="w-full border border-sand-200 rounded-lg px-3 py-2 text-sm text-sand-900 bg-white focus:outline-none focus:ring-2 focus:ring-sand-900/10 focus:border-sand-300"
            >
              {BADGE_STYLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-sand-500 mb-1">Label</label>
            {useCustomLabel ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => onCustomLabelChange(e.target.value)}
                  placeholder="Custom label"
                  className="flex-1 border border-sand-200 rounded-lg px-3 py-2 text-sm text-sand-900 bg-white focus:outline-none focus:ring-2 focus:ring-sand-900/10 focus:border-sand-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    onToggleCustomLabel(false);
                    onCustomLabelChange("");
                  }}
                  className="text-xs text-sand-500 hover:text-sand-900 transition-colors whitespace-nowrap"
                >
                  Presets
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  value={badgeLabel}
                  onChange={(e) => onLabelChange(e.target.value)}
                  className="flex-1 border border-sand-200 rounded-lg px-3 py-2 text-sm text-sand-900 bg-white focus:outline-none focus:ring-2 focus:ring-sand-900/10 focus:border-sand-300"
                >
                  {BADGE_LABEL_PRESETS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onToggleCustomLabel(true)}
                  className="text-xs text-sand-500 hover:text-sand-900 transition-colors whitespace-nowrap"
                >
                  Custom
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Badge snippets */}
      <section className="border border-sand-200 rounded-xl p-4 space-y-4">
        <h2 className="text-sm font-medium text-sand-700">Embed Code</h2>

        <SnippetBlock
          label="Markdown (GitHub README)"
          snippet={markdownSnippet}
          copied={copied === "markdown"}
          onCopy={() => onCopy(markdownSnippet, "markdown")}
        />

        <SnippetBlock
          label="HTML"
          snippet={htmlSnippet}
          copied={copied === "html"}
          onCopy={() => onCopy(htmlSnippet, "html")}
        />

        <SnippetBlock
          label="Badge URL only"
          snippet={badgeUrl}
          copied={copied === "url"}
          onCopy={() => onCopy(badgeUrl, "url")}
        />
      </section>

      <p className="text-xs text-sand-400">
        The badge SVG is cached for up to 24 hours. After a new scan, share the
        result to update the badge grade automatically.{" "}
        <a
          href="/docs/badge"
          className="underline hover:text-sand-600 transition-colors"
        >
          Read the docs
        </a>
      </p>
    </>
  );
}

/* ── Widget Tab ─────────────────────────────────────────────────────── */

function WidgetEmbedConfigurator({
  selectedResult,
  widgetSnippet,
  theme,
  onThemeChange,
  size,
  onSizeChange,
  showFindings,
  onShowFindingsChange,
  copied,
  onCopy,
}: {
  readonly selectedResult: SharedResult | null;
  readonly widgetSnippet: string;
  readonly theme: Theme;
  readonly onThemeChange: (t: Theme) => void;
  readonly size: Size;
  readonly onSizeChange: (s: Size) => void;
  readonly showFindings: boolean;
  readonly onShowFindingsChange: (v: boolean) => void;
  readonly copied: boolean;
  readonly onCopy: () => void;
}) {
  return (
    <>
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
                  onClick={() => onThemeChange(t)}
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
                  onClick={() => onSizeChange(s)}
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
              onClick={() => onShowFindingsChange(!showFindings)}
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
            onClick={onCopy}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-sand-200 text-sand-600 hover:border-sand-300 hover:text-sand-900 transition-colors"
          >
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>
        </div>
        <pre className="bg-sand-50 border border-sand-200 rounded-lg p-3 text-xs text-sand-700 overflow-x-auto whitespace-pre-wrap break-all">
          {widgetSnippet}
        </pre>
      </section>
    </>
  );
}

/* ── Shared sub-components ──────────────────────────────────────────── */

function SnippetBlock({
  label,
  snippet,
  copied,
  onCopy,
}: {
  readonly label: string;
  readonly snippet: string;
  readonly copied: boolean;
  readonly onCopy: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-sand-500">{label}</span>
        <button
          type="button"
          onClick={onCopy}
          className="text-xs text-sand-500 hover:text-sand-900 transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="bg-sand-50 border border-sand-200 rounded-lg p-3 text-xs text-sand-700 overflow-x-auto whitespace-pre-wrap break-all">
        {snippet}
      </pre>
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
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ color: "#b91c1c" }}
            >
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
