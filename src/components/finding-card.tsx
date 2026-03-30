"use client";

import { useCallback, useState } from "react";
import type { Finding, RemediationSnippet } from "@/types/scanner";
import {
  trackRemediationCopied,
  trackRemediationViewed,
  trackRemediationUpgradePrompt,
} from "@/lib/analytics/gtag";
import { trackRemediationSnippetCopied } from "@/lib/analytics/datalayer";

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

const FREE_SNIPPET_LIMIT = 3;

interface FindingCardProps {
  readonly finding: Finding;
  readonly isPro?: boolean;
  readonly snippetsBudget?: {
    readonly used: number;
    readonly onUse: (count: number) => void;
  };
}

function CopyButton({
  code,
  finding,
  snippet,
}: {
  readonly code: string;
  readonly finding: Finding;
  readonly snippet: RemediationSnippet;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    trackRemediationCopied(finding.category, snippet.label);
    trackRemediationSnippetCopied(
      finding.category,
      snippet.label,
      finding.title,
    );
    setTimeout(() => setCopied(false), 2000);
  }, [code, finding.category, finding.title, snippet.label]);

  return (
    <button
      onClick={handleCopy}
      className="text-xs px-2 py-1 rounded bg-sand-700 hover:bg-sand-600 text-sand-200 transition-colors shrink-0"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function SnippetBlock({
  snippet,
  finding,
}: {
  readonly snippet: RemediationSnippet;
  readonly finding: Finding;
}) {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-sand-500">{snippet.label}</span>
        <CopyButton code={snippet.code} finding={finding} snippet={snippet} />
      </div>
      <pre className="p-3 bg-sand-900 rounded-lg text-xs text-sand-100 font-mono whitespace-pre-wrap overflow-x-auto">
        {snippet.code}
      </pre>
    </div>
  );
}

function UpgradePrompt({ category }: { readonly category: string }) {
  return (
    <div className="mt-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
      <p className="text-xs text-indigo-700">
        Upgrade to Pro to unlock all fix snippets with contextual code for your
        project.
      </p>
      <a
        href="/pricing"
        onClick={() => trackRemediationUpgradePrompt(category)}
        className="inline-block mt-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors"
      >
        View Pro plans
      </a>
    </div>
  );
}

export function FindingCard({ finding, isPro, snippetsBudget }: FindingCardProps) {
  const [expanded, setExpanded] = useState(false);

  const snippets = finding.remediationSnippets ?? [];
  const hasSnippets = snippets.length > 0;

  const handleToggle = useCallback(() => {
    const willExpand = !expanded;
    setExpanded(willExpand);
    if (willExpand) {
      trackRemediationViewed(finding.category);
    }
  }, [expanded, finding.category]);

  const remainingBudget =
    isPro || !snippetsBudget
      ? Infinity
      : Math.max(0, FREE_SNIPPET_LIMIT - snippetsBudget.used);

  const visibleSnippets = isPro
    ? snippets
    : snippets.slice(0, remainingBudget);

  const gatedCount = snippets.length - visibleSnippets.length;

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
          onClick={handleToggle}
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

          {hasSnippets && (
            <div className="mt-3 space-y-3">
              {visibleSnippets.map((snippet, index) => (
                <SnippetBlock
                  key={`${snippet.label}-${index}`}
                  snippet={snippet}
                  finding={finding}
                />
              ))}
              {gatedCount > 0 && (
                <UpgradePrompt category={finding.category} />
              )}
            </div>
          )}

          {!hasSnippets && (
            <code className="block mt-2 p-3 bg-sand-900 rounded-lg text-xs text-sand-100 font-mono whitespace-pre-wrap">
              {finding.remediation}
            </code>
          )}
        </div>
      )}
    </div>
  );
}
