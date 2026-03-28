"use client";

import { useState, useCallback } from "react";

interface GetBadgeButtonProps {
  readonly scanJobId: string;
}

type BadgeState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly shareId: string }
  | { readonly status: "error"; readonly message: string };

type CopiedSnippet = "markdown" | "html" | null;

const BADGE_HOST = "https://supabase-scanner.vercel.app";

export function GetBadgeButton({ scanJobId }: GetBadgeButtonProps) {
  const [state, setState] = useState<BadgeState>({ status: "idle" });
  const [panelOpen, setPanelOpen] = useState(false);
  const [copied, setCopied] = useState<CopiedSnippet>(null);

  const handleGetBadge = useCallback(async () => {
    if (state.status === "ready") {
      setPanelOpen((prev) => !prev);
      return;
    }

    setState({ status: "loading" });

    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scanJobId }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setState({
        status: "error",
        message:
          (data as { error?: string }).error ?? "Failed to create share link",
      });
      return;
    }

    const data = (await res.json()) as { shareId: string };
    setState({ status: "ready", shareId: data.shareId });
    setPanelOpen(true);
  }, [scanJobId, state.status]);

  const handleCopy = useCallback(
    async (text: string, type: CopiedSnippet) => {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    },
    [],
  );

  const shareId = state.status === "ready" ? state.shareId : null;
  const badgeUrl = shareId ? `${BADGE_HOST}/api/badge/${shareId}` : "";
  const markdownSnippet = shareId
    ? `[![SupaScanner](${badgeUrl})](${BADGE_HOST}/results/${shareId})`
    : "";
  const htmlSnippet = shareId
    ? `<a href="${BADGE_HOST}/results/${shareId}"><img src="${badgeUrl}" alt="SupaScanner Security Score" /></a>`
    : "";

  return (
    <div className="relative inline-block">
      <button
        onClick={handleGetBadge}
        disabled={state.status === "loading"}
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
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
        {state.status === "loading" ? "Loading..." : "Get Badge"}
      </button>

      {state.status === "error" && (
        <p className="absolute top-full left-0 mt-1 text-xs text-red-600">
          {state.message}
        </p>
      )}

      {panelOpen && shareId && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-sand-200 rounded-xl shadow-lg z-10 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-sand-900">
              Badge for README
            </h3>
            <button
              onClick={() => setPanelOpen(false)}
              className="text-sand-400 hover:text-sand-600 transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex justify-center p-3 bg-sand-50 rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={badgeUrl} alt="SupaScanner badge preview" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-sand-500">
                Markdown
              </label>
              <button
                onClick={() => handleCopy(markdownSnippet, "markdown")}
                className="text-xs text-sand-500 hover:text-sand-900 transition-colors"
              >
                {copied === "markdown" ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="bg-sand-50 border border-sand-200 rounded-lg p-2 text-xs text-sand-700 overflow-x-auto whitespace-pre-wrap break-all">
              {markdownSnippet}
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-sand-500">HTML</label>
              <button
                onClick={() => handleCopy(htmlSnippet, "html")}
                className="text-xs text-sand-500 hover:text-sand-900 transition-colors"
              >
                {copied === "html" ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="bg-sand-50 border border-sand-200 rounded-lg p-2 text-xs text-sand-700 overflow-x-auto whitespace-pre-wrap break-all">
              {htmlSnippet}
            </pre>
          </div>

          <p className="text-[11px] text-sand-400">
            Customize with{" "}
            <code className="bg-sand-100 px-1 rounded">?style=flat-square</code>{" "}
            or{" "}
            <code className="bg-sand-100 px-1 rounded">
              ?label=security
            </code>
          </p>
        </div>
      )}
    </div>
  );
}
