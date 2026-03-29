"use client";

import { useState, useCallback, useEffect } from "react";
import { trackScanShared } from "@/lib/analytics/datalayer";

interface SocialShareRowProps {
  readonly grade: string;
  readonly totalFindings: number;
  readonly shareUrl?: string;
  readonly scanJobId?: string;
}

export function SocialShareRow({
  grade,
  totalFindings,
  shareUrl: initialShareUrl,
  scanJobId,
}: SocialShareRowProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(
    initialShareUrl ?? null,
  );
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" &&
        typeof navigator.share === "function",
    );
  }, []);

  const resolveShareUrl = useCallback(async (): Promise<string | null> => {
    if (shareUrl) return shareUrl;
    if (!scanJobId) return null;

    setLoading(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanJobId }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { shareId: string };
      const url = `${window.location.origin}/results/${data.shareId}`;
      setShareUrl(url);
      return url;
    } finally {
      setLoading(false);
    }
  }, [shareUrl, scanJobId]);

  const twitterText = `Just scanned my Supabase project with @SupaScanner -- scored ${grade}! Check yours:`;

  async function handleShareX() {
    const url = await resolveShareUrl();
    if (!url) return;
    trackScanShared();
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function handleShareLinkedIn() {
    const url = await resolveShareUrl();
    if (!url) return;
    trackScanShared();
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function handleCopyLink() {
    const url = await resolveShareUrl();
    if (!url) return;
    trackScanShared();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleNativeShare() {
    const url = await resolveShareUrl();
    if (!url) return;
    trackScanShared();
    const findingsLabel =
      totalFindings === 1 ? "1 issue" : `${totalFindings} issues`;
    try {
      await navigator.share({
        title: `SupaScanner Security Grade: ${grade}`,
        text: `Ran a security audit on my Supabase project using SupaScanner. Found ${findingsLabel} I didn't know about. Free tool:`,
        url,
      });
    } catch {
      // User cancelled native share sheet
    }
  }

  const iconBtn =
    "inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-sand-600 bg-white border border-sand-200 rounded-lg hover:bg-sand-50 hover:text-sand-900 transition-colors disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {canNativeShare && (
        <button
          onClick={handleNativeShare}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium bg-sand-900 text-white rounded-lg hover:bg-sand-800 transition-colors disabled:opacity-50"
        >
          <ShareIcon />
          Share
        </button>
      )}
      <button
        onClick={handleShareX}
        disabled={loading}
        className={iconBtn}
        title="Share on X"
      >
        <XIcon />
        <span className="hidden sm:inline">X</span>
      </button>
      <button
        onClick={handleShareLinkedIn}
        disabled={loading}
        className={iconBtn}
        title="Share on LinkedIn"
      >
        <LinkedInIcon />
        <span className="hidden sm:inline">LinkedIn</span>
      </button>
      <button
        onClick={handleCopyLink}
        disabled={loading}
        className={iconBtn}
        title="Copy link"
      >
        {copied ? <CheckIcon /> : <LinkIcon />}
        <span className="hidden sm:inline">
          {copied ? "Copied!" : "Copy link"}
        </span>
      </button>
    </div>
  );
}

function ShareIcon() {
  return (
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
  );
}

function XIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function LinkIcon() {
  return (
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
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-emerald-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
