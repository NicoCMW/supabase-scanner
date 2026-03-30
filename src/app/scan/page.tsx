"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScanForm } from "@/components/scan-form";
import { ScanResults } from "@/components/scan-results";
import { PostScanCta } from "@/components/post-scan-cta";
import { DownloadReportButton } from "@/components/download-report-button";
import { ComplianceReportButton } from "@/components/compliance-report-button";
import { FeedbackWidget } from "@/components/feedback-widget";
import type { Grade, ScanModuleResult, FindingCategory } from "@/types/scanner";

interface ScanResponse {
  readonly scanJobId: string;
  readonly grade: Grade;
  readonly totalFindings: number;
  readonly modules: readonly ScanModuleResult[];
  readonly durationMs: number;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly cached?: boolean;
  readonly cachedAt?: string;
  readonly cacheAgeSeconds?: number;
}

function ScanPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get("url") ?? undefined;
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFreePlan, setIsFreePlan] = useState(false);
  const [forceRescan, setForceRescan] = useState(false);

  useEffect(() => {
    fetch("/api/billing/usage")
      .then((r) => r.json())
      .then((data) => setIsFreePlan(data.plan === "free"))
      .catch(() => {});
  }, []);

  function handleScanComplete(data: unknown) {
    setError(null);
    setForceRescan(false);
    setResult(data as ScanResponse);
  }

  function handleScanError(message: string) {
    setResult(null);
    setError(message);
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setForceRescan(false);
  }

  function handleRescan() {
    setForceRescan(true);
    setResult(null);
    setError(null);
  }

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold text-sand-900">New Scan</h1>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-sand-400 hover:text-sand-900 transition-colors"
        >
          Back to dashboard
        </button>
      </header>

      {error && (
        <div className="w-full max-w-xl mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {result ? (
        <>
          <ScanResults
            grade={result.grade}
            totalFindings={result.totalFindings}
            modules={result.modules}
            durationMs={result.durationMs}
            onReset={handleReset}
            cached={result.cached}
            cacheAgeSeconds={result.cacheAgeSeconds}
            onRescan={handleRescan}
            isPro={!isFreePlan}
          />
          <div className="w-full max-w-3xl mt-4 flex flex-wrap gap-3">
            <DownloadReportButton
              scanJobId={result.scanJobId}
              isFreePlan={isFreePlan}
            />
            <ComplianceReportButton
              scanJobId={result.scanJobId}
              isPro={!isFreePlan}
            />
          </div>
          {isFreePlan && <ScanNudges result={result} />}
          <FeedbackWidget
            scanJobId={result.scanJobId}
            scanGrade={result.grade}
            findingCount={result.totalFindings}
          />
        </>
      ) : (
        <div className="flex flex-col items-center">
          <p className="text-sand-500 mb-6 text-center max-w-xl text-sm leading-relaxed">
            Enter your Supabase project URL and anon key to scan for security
            misconfigurations. Your credentials are never stored.
          </p>
          <ScanForm
            onScanComplete={handleScanComplete}
            onScanError={handleScanError}
            initialUrl={initialUrl}
            forceRescan={forceRescan}
          />
        </div>
      )}
    </main>
  );
}

function ScanNudges({ result }: { readonly result: ScanResponse }) {
  const allFindings = result.modules.flatMap((m) => m.findings);
  const criticalCount = allFindings.filter(
    (f) => f.severity === "critical",
  ).length;
  const highCount = allFindings.filter((f) => f.severity === "high").length;
  const mediumCount = allFindings.filter((f) => f.severity === "medium").length;
  const lowCount = allFindings.filter((f) => f.severity === "low").length;
  const categories = [
    ...new Set(allFindings.map((f) => f.category)),
  ] as FindingCategory[];

  return (
    <PostScanCta
      totalFindings={result.totalFindings}
      grade={result.grade}
      criticalCount={criticalCount}
      highCount={highCount}
      mediumCount={mediumCount}
      lowCount={lowCount}
      categories={categories}
    />
  );
}

export default function ScanPage() {
  return (
    <Suspense>
      <ScanPageInner />
    </Suspense>
  );
}
