"use client";

import { useState } from "react";

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
          className="block text-sm font-medium text-gray-300 mb-1"
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
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          disabled={scanning}
        />
      </div>

      <div>
        <label
          htmlFor="anonKey"
          className="block text-sm font-medium text-gray-300 mb-1"
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
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          disabled={scanning}
        />
        <p className="text-xs text-gray-500 mt-1">
          Your anon key is only used during the scan and is never stored.
        </p>
      </div>

      <button
        type="submit"
        disabled={scanning}
        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-400 text-white font-medium rounded-lg transition-colors"
      >
        {scanning ? "Scanning..." : "Run Security Scan"}
      </button>
    </form>
  );
}
