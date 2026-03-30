"use client";

import { useEffect, useState, useCallback } from "react";

interface ReferralData {
  readonly code: string;
  readonly referralLink: string;
  readonly stats: {
    readonly totalReferred: number;
    readonly totalConverted: number;
    readonly totalCredited: number;
  };
}

export function ReferralDashboard() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((d) => {
        if (d) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyLink = useCallback(async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [data]);

  const shareToX = useCallback(() => {
    if (!data) return;
    const text = encodeURIComponent(
      `I use SupaScanner to find security issues in my Supabase project. Check yours free: ${data.referralLink}`,
    );
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
  }, [data]);

  const shareToLinkedIn = useCallback(() => {
    if (!data) return;
    const url = encodeURIComponent(data.referralLink);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      "_blank",
    );
  }, [data]);

  if (loading) {
    return (
      <div className="p-4 rounded-lg border border-sand-200 bg-white animate-pulse">
        <div className="h-4 bg-sand-100 rounded w-48 mb-3" />
        <div className="h-8 bg-sand-100 rounded w-full" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-lg border border-sand-200 bg-white overflow-hidden">
      <div className="p-4 border-b border-sand-100">
        <h2 className="text-sm font-semibold text-sand-900">
          Refer a friend
        </h2>
        <p className="text-xs text-sand-400 mt-0.5">
          Give 1 month Pro, get 1 month Pro
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Referral link */}
        <div>
          <label className="block text-xs font-medium text-sand-500 mb-1.5">
            Your referral link
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={data.referralLink}
              className="flex-1 px-3 py-2 bg-sand-50 border border-sand-200 rounded-lg text-sand-700 text-sm font-mono select-all"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={copyLink}
              className="px-3 py-2 bg-sand-900 hover:bg-sand-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="flex gap-2">
          <button
            onClick={shareToX}
            className="flex-1 px-3 py-2 border border-sand-200 hover:border-sand-300 text-sand-700 text-sm font-medium rounded-lg transition-colors"
          >
            Share on X
          </button>
          <button
            onClick={shareToLinkedIn}
            className="flex-1 px-3 py-2 border border-sand-200 hover:border-sand-300 text-sand-700 text-sm font-medium rounded-lg transition-colors"
          >
            Share on LinkedIn
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <StatCard label="Referred" value={data.stats.totalReferred} />
          <StatCard label="Converted" value={data.stats.totalConverted} />
          <StatCard label="Credits earned" value={data.stats.totalCredited} />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number;
}) {
  return (
    <div className="text-center p-3 bg-sand-50 rounded-lg">
      <p className="text-lg font-semibold text-sand-900">{value}</p>
      <p className="text-xs text-sand-400">{label}</p>
    </div>
  );
}
