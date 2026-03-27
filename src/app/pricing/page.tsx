"use client";

import { useState } from "react";
import { PLANS } from "@/lib/billing/plans";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <nav className="mb-16">
          <a
            href="/"
            className="text-base font-semibold tracking-tight text-sand-900"
          >
            SupaScanner
          </a>
        </nav>

        <h1 className="text-3xl font-semibold text-center mb-2 text-sand-900">
          Pricing
        </h1>
        <p className="text-sand-500 text-center mb-12 text-sm">
          Scan your Supabase project for security vulnerabilities.
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-xl mx-auto">
          <div className="border border-sand-200 rounded-xl p-7 bg-white">
            <h2 className="text-lg font-semibold mb-1 text-sand-900">
              {PLANS.free.name}
            </h2>
            <div className="mb-6">
              <span className="text-3xl font-semibold text-sand-900">$0</span>
              <span className="text-sand-400 text-sm">/month</span>
            </div>
            <ul className="space-y-2.5 mb-8 text-sand-600 text-sm">
              <li>{PLANS.free.scansPerMonth} scans per month</li>
              <li>All security checks included</li>
              <li>AI-powered fix suggestions</li>
              <li>Scan history</li>
            </ul>
            <a
              href="/login"
              className="block w-full text-center py-2.5 rounded-lg border border-sand-200 hover:border-sand-300 text-sand-700 font-medium text-sm transition-colors"
            >
              Get started
            </a>
          </div>

          <div className="border border-sand-900 rounded-xl p-7 bg-white relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-sand-900 text-white text-xs font-medium px-3 py-0.5 rounded-full">
              Recommended
            </div>
            <h2 className="text-lg font-semibold mb-1 text-sand-900">
              {PLANS.pro.name}
            </h2>
            <div className="mb-6">
              <span className="text-3xl font-semibold text-sand-900">
                ${PLANS.pro.priceMonthly}
              </span>
              <span className="text-sand-400 text-sm">/month</span>
            </div>
            <ul className="space-y-2.5 mb-8 text-sand-600 text-sm">
              <li>Unlimited scans</li>
              <li>All security checks included</li>
              <li>AI-powered fix suggestions</li>
              <li>Scan history</li>
              <li>Priority support</li>
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="block w-full text-center py-2.5 rounded-lg bg-sand-900 hover:bg-sand-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Redirecting..." : "Upgrade to Pro"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
