"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScanForm } from "@/components/scan-form";
import { ScanResults } from "@/components/scan-results";
import type { Grade, ScanModuleResult } from "@/types/scanner";

interface ScanResponse {
  readonly scanJobId: string;
  readonly grade: Grade;
  readonly totalFindings: number;
  readonly modules: readonly ScanModuleResult[];
  readonly durationMs: number;
  readonly startedAt: string;
  readonly completedAt: string;
}

export default function ScanPage() {
  const router = useRouter();
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleScanComplete(data: unknown) {
    setError(null);
    setResult(data as ScanResponse);
  }

  function handleScanError(message: string) {
    setResult(null);
    setError(message);
  }

  function handleReset() {
    setResult(null);
    setError(null);
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">New Scan</h1>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-gray-400 hover:text-gray-200"
        >
          Back to Dashboard
        </button>
      </header>

      {error && (
        <div className="w-full max-w-xl mb-6 p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {result ? (
        <ScanResults
          grade={result.grade}
          totalFindings={result.totalFindings}
          modules={result.modules}
          durationMs={result.durationMs}
          onReset={handleReset}
        />
      ) : (
        <div className="flex flex-col items-center">
          <p className="text-gray-400 mb-6 text-center max-w-xl">
            Enter your Supabase project URL and anon key to scan for security
            misconfigurations. Your credentials are never stored.
          </p>
          <ScanForm
            onScanComplete={handleScanComplete}
            onScanError={handleScanError}
          />
        </div>
      )}
    </main>
  );
}
