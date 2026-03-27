"use client";

import { useEffect, useState } from "react";
import type { UsageStatus } from "@/lib/billing/usage";

export function UsageBanner() {
  const [usage, setUsage] = useState<UsageStatus | null>(null);

  useEffect(() => {
    fetch("/api/billing/usage")
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => {});
  }, []);

  if (!usage) return null;

  const isLimited = usage.scansLimit !== Infinity;
  const remaining = isLimited
    ? usage.scansLimit - usage.scansUsed
    : null;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-800 mb-6">
      <div>
        <span className="text-sm font-medium capitalize">
          {usage.plan} Plan
        </span>
        {isLimited && (
          <span className="text-sm text-gray-400 ml-3">
            {remaining} of {usage.scansLimit} scans remaining this month
          </span>
        )}
        {!isLimited && (
          <span className="text-sm text-gray-400 ml-3">
            Unlimited scans
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {usage.plan === "free" && (
          <a
            href="/pricing"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Upgrade to Pro
          </a>
        )}
        {usage.plan === "pro" && (
          <ManageBillingButton />
        )}
      </div>
    </div>
  );
}

function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-sm text-gray-400 hover:text-gray-200 disabled:opacity-50"
    >
      {loading ? "Loading..." : "Manage Billing"}
    </button>
  );
}
