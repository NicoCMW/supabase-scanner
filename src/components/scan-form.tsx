"use client";

import { useState } from "react";
import { trackScanStarted, trackScanCompleted } from "@/lib/analytics/gtag";

interface ScanFormProps {
  readonly onScanComplete: (result: unknown) => void;
  readonly onScanError: (error: string) => void;
}

export function ScanForm({ onScanComplete, onScanError }: ScanFormProps) {
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [scanning, setScanning] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setScanning(true);
    trackScanStarted();

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supabaseUrl, anonKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        onScanError(data.error ?? "Scan failed");
        return;
      }

      const result = data as { grade: string; totalFindings: number; durationMs: number };
      trackScanCompleted(result.grade, result.totalFindings, result.durationMs);
      onScanComplete(data);
    } catch {
      onScanError("Network error. Please try again.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-4">
      <div>
        <label
          htmlFor="supabaseUrl"
          className="block text-sm font-medium text-sand-700 mb-1.5"
        >
          Supabase Project URL
        </label>
        <input
          id="supabaseUrl"
          type="url"
          required
          placeholder="https://your-project.supabase.co"
          value={supabaseUrl}
          onChange={(e) => setSupabaseUrl(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-sand-200 rounded-lg text-sand-900 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-sand-900/10 focus:border-sand-300 transition-colors"
          disabled={scanning}
        />
      </div>

      <div>
        <label
          htmlFor="anonKey"
          className="block text-sm font-medium text-sand-700 mb-1.5"
        >
          Anon (Public) Key
        </label>
        <input
          id="anonKey"
          type="password"
          required
          placeholder="eyJhbGciOiJIUzI1NiIs..."
          value={anonKey}
          onChange={(e) => setAnonKey(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-sand-200 rounded-lg text-sand-900 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-sand-900/10 focus:border-sand-300 transition-colors"
          disabled={scanning}
        />
        <p className="text-xs text-sand-400 mt-1.5">
          Your anon key is only used during the scan and is never stored.
        </p>
      </div>

      <button
        type="submit"
        disabled={scanning}
        className="w-full py-2.5 px-4 bg-sand-900 hover:bg-sand-700 disabled:bg-sand-200 disabled:text-sand-400 text-white font-medium rounded-lg transition-colors text-sm"
      >
        {scanning ? "Scanning..." : "Run security scan"}
      </button>
    </form>
  );
}
