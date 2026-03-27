"use client";

import { useState } from "react";

interface ShareButtonProps {
  readonly scanJobId: string;
}

type ShareState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly shareId: string }
  | { readonly status: "copied"; readonly shareId: string }
  | { readonly status: "error"; readonly message: string };

export function ShareButton({ scanJobId }: ShareButtonProps) {
  const [state, setState] = useState<ShareState>({ status: "idle" });
  const [menuOpen, setMenuOpen] = useState(false);

  async function createShare(): Promise<string | null> {
    if (state.status === "ready" || state.status === "copied") {
      return state.shareId;
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
        message: (data as { error?: string }).error ?? "Failed to create share link",
      });
      return null;
    }

    const data = (await res.json()) as { shareId: string };
    setState({ status: "ready", shareId: data.shareId });
    return data.shareId;
  }

  function getShareUrl(shareId: string): string {
    return `${window.location.origin}/results/${shareId}`;
  }

  async function handleCopyLink() {
    const shareId = await createShare();
    if (!shareId) return;

    const url = getShareUrl(shareId);
    await navigator.clipboard.writeText(url);
    setState({ status: "copied", shareId });
    setMenuOpen(false);

    setTimeout(() => {
      setState((prev) =>
        prev.status === "copied" ? { status: "ready", shareId } : prev,
      );
    }, 2000);
  }

  async function handleShareTwitter() {
    const shareId = await createShare();
    if (!shareId) return;

    const url = getShareUrl(shareId);
    const text = `My Supabase project just scored a security grade on SupaScanner! Check it out:`;
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setMenuOpen(false);
  }

  async function handleShareLinkedIn() {
    const shareId = await createShare();
    if (!shareId) return;

    const url = getShareUrl(shareId);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setMenuOpen(false);
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => {
          if (state.status === "idle") {
            createShare().then(() => setMenuOpen(true));
          } else {
            setMenuOpen((prev) => !prev);
          }
        }}
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
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        {state.status === "loading"
          ? "Creating link..."
          : state.status === "copied"
            ? "Link copied!"
            : "Share your grade"}
      </button>

      {state.status === "error" && (
        <p className="absolute top-full left-0 mt-1 text-xs text-red-600">
          {state.message}
        </p>
      )}

      {menuOpen &&
        (state.status === "ready" || state.status === "copied") && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-sand-200 rounded-lg shadow-lg z-10">
            <button
              onClick={handleCopyLink}
              className="w-full text-left px-4 py-2.5 text-sm text-sand-700 hover:bg-sand-50 transition-colors rounded-t-lg"
            >
              {state.status === "copied" ? "Copied!" : "Copy link"}
            </button>
            <button
              onClick={handleShareTwitter}
              className="w-full text-left px-4 py-2.5 text-sm text-sand-700 hover:bg-sand-50 transition-colors"
            >
              Share on X
            </button>
            <button
              onClick={handleShareLinkedIn}
              className="w-full text-left px-4 py-2.5 text-sm text-sand-700 hover:bg-sand-50 transition-colors rounded-b-lg"
            >
              Share on LinkedIn
            </button>
          </div>
        )}
    </div>
  );
}
