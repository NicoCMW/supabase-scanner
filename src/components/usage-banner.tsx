"use client";

import { useEffect, useState } from "react";
import type { UsageStatus } from "@/lib/billing/usage";

interface UsageWithBilling extends UsageStatus {
  readonly billingEnabled: boolean;
}

export function UsageBanner() {
  const [usage, setUsage] = useState<UsageWithBilling | null>(null);

  useEffect(() => {
    fetch("/api/billing/usage")
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (data) setUsage(data);
      })
      .catch(() => {});
  }, []);

  if (!usage) return null;

  const isLimited = usage.scansLimit !== Infinity;
  const remaining = isLimited ? usage.scansLimit - usage.scansUsed : null;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-sand-200 bg-white mb-6">
      <div>
        <span className="text-sm font-medium text-sand-900 capitalize">
          {usage.plan} Plan
        </span>
        {isLimited && (
          <span className="text-sm text-sand-400 ml-3">
            {remaining} of {usage.scansLimit} scans remaining this month
          </span>
        )}
        {!isLimited && (
          <span className="text-sm text-sand-400 ml-3">Unlimited scans</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {usage.plan === "free" && usage.billingEnabled && (
          <a
            href="/pricing"
            className="text-sm text-sand-600 hover:text-sand-900 underline underline-offset-2 transition-colors"
          >
            Upgrade to Pro
          </a>
        )}
        {usage.plan === "free" && !usage.billingEnabled && (
          <span className="text-sm text-sand-400">
            Pro coming soon
          </span>
        )}
        {usage.plan === "pro" && <ManageBillingButton />}
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
      className="text-sm text-sand-400 hover:text-sand-900 disabled:opacity-50 transition-colors"
    >
      {loading ? "Loading..." : "Manage billing"}
    </button>
  );
}
