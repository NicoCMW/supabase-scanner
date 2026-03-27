"use client";

import { useState } from "react";
import { ScanForm } from "@/components/scan-form";
import { ScanResults } from "@/components/scan-results";
import type { Grade, ScanModuleResult } from "@/types/scanner";

interface ScanResponse {
  readonly grade: Grade;
  readonly totalFindings: number;
  readonly modules: readonly ScanModuleResult[];
  readonly durationMs: number;
  readonly startedAt: string;
  readonly completedAt: string;
}

export default function Home() {
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
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Supabase Security Scanner</h1>
      <p className="text-gray-400 text-lg mb-8 max-w-xl text-center">
        Scan your Supabase project for common security misconfigurations.
        Check RLS policies, storage permissions, and auth settings in seconds.
      </p>

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
        <ScanForm
          onScanComplete={handleScanComplete}
          onScanError={handleScanError}
        />
      )}
    </main>
  );
}
