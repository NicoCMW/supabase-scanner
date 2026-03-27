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
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">Pricing</h1>
        <p className="text-gray-400 text-center mb-12">
          Scan your Supabase project for security vulnerabilities
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="border border-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-1">{PLANS.free.name}</h2>
            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8 text-gray-300">
              <li>
                {PLANS.free.scansPerMonth} scans per month
              </li>
              <li>All security checks included</li>
              <li>AI-powered fix suggestions</li>
              <li>Scan history</li>
            </ul>
            <a
              href="/login"
              className="block w-full text-center py-3 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors"
            >
              Get Started
            </a>
          </div>

          {/* Pro Plan */}
          <div className="border border-blue-600 rounded-2xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-sm font-medium px-3 py-1 rounded-full">
              Recommended
            </div>
            <h2 className="text-2xl font-bold mb-1">{PLANS.pro.name}</h2>
            <div className="mb-6">
              <span className="text-4xl font-bold">
                ${PLANS.pro.priceMonthly}
              </span>
              <span className="text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8 text-gray-300">
              <li>Unlimited scans</li>
              <li>All security checks included</li>
              <li>AI-powered fix suggestions</li>
              <li>Scan history</li>
              <li>Priority support</li>
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="block w-full text-center py-3 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {loading ? "Redirecting..." : "Upgrade to Pro"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
