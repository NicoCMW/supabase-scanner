"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ScanForm } from "@/components/scan-form";
import { ScanResults } from "@/components/scan-results";
import {
  trackOnboardingStep,
  trackOnboardingCompleted,
  trackOnboardingSkipped,
} from "@/lib/analytics/gtag";
import type { Grade, ScanModuleResult } from "@/types/scanner";

const ONBOARDING_COMPLETED_KEY = "supascanner_onboarding_completed";
const TOTAL_STEPS = 5;

interface ScanResponse {
  readonly scanJobId: string;
  readonly grade: Grade;
  readonly totalFindings: number;
  readonly modules: readonly ScanModuleResult[];
  readonly durationMs: number;
  readonly startedAt: string;
  readonly completedAt: string;
}

export function hasCompletedOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "1";
}

function markOnboardingComplete(): void {
  localStorage.setItem(ONBOARDING_COMPLETED_KEY, "1");
}

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    trackOnboardingStep(0, "welcome");
  }, []);

  const goToStep = useCallback((step: number, stepName: string) => {
    setCurrentStep(step);
    trackOnboardingStep(step, stepName);
  }, []);

  const handleSkip = useCallback(() => {
    trackOnboardingSkipped(currentStep);
    markOnboardingComplete();
    router.refresh();
  }, [currentStep, router]);

  const handleScanComplete = useCallback(
    (data: unknown) => {
      setScanError(null);
      setScanResult(data as ScanResponse);
      goToStep(3, "results");
    },
    [goToStep],
  );

  const handleScanError = useCallback((message: string) => {
    setScanResult(null);
    setScanError(message);
  }, []);

  const handleFinish = useCallback(() => {
    trackOnboardingCompleted();
    markOnboardingComplete();
    router.refresh();
  }, [router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center">
      <ProgressBar currentStep={currentStep} />

      {currentStep === 0 && (
        <StepWelcome
          onNext={() => goToStep(1, "connect")}
          onSkip={handleSkip}
        />
      )}

      {currentStep === 1 && (
        <StepConnect
          onScanComplete={handleScanComplete}
          onScanError={handleScanError}
          scanError={scanError}
          onSkip={handleSkip}
        />
      )}

      {currentStep === 2 && (
        <StepScanning />
      )}

      {currentStep === 3 && scanResult && (
        <StepResults
          result={scanResult}
          onNext={() => goToStep(4, "next_steps")}
        />
      )}

      {currentStep === 4 && (
        <StepNextSteps
          scanResult={scanResult}
          onFinish={handleFinish}
        />
      )}
    </div>
  );
}

function ProgressBar({ currentStep }: { readonly currentStep: number }) {
  return (
    <div className="w-full max-w-md mb-10">
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                i < currentStep
                  ? "bg-sand-900 text-white"
                  : i === currentStep
                    ? "bg-sand-900 text-white ring-4 ring-sand-200"
                    : "bg-sand-100 text-sand-400 border border-sand-200"
              }`}
            >
              {i < currentStep ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 8l3.5 3.5L13 5" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            {i < TOTAL_STEPS - 1 && (
              <div
                className={`w-12 sm:w-16 h-0.5 mx-1 transition-colors ${
                  i < currentStep ? "bg-sand-900" : "bg-sand-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-sand-400 text-center">
        Step {currentStep + 1} of {TOTAL_STEPS}
      </p>
    </div>
  );
}

function StepWelcome({
  onNext,
  onSkip,
}: {
  readonly onNext: () => void;
  readonly onSkip: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center max-w-lg">
      <div className="w-16 h-16 mb-6 rounded-2xl bg-sand-900 flex items-center justify-center">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-sand-900 mb-3">
        Welcome to SupaScanner
      </h2>
      <p className="text-sand-500 text-sm leading-relaxed mb-2">
        Find security misconfigurations in your Supabase project in under 60
        seconds. We check RLS policies, storage rules, and auth configuration so
        you can ship with confidence.
      </p>
      <div className="flex items-start gap-6 mt-8 mb-10 text-left">
        <ValueProp
          icon={
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          }
          title="Instant security scan"
          text="Paste your project URL and get a full security grade in under a minute."
        />
        <ValueProp
          icon={
            <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          }
          title="Actionable findings"
          text="Each issue comes with severity, context, and a clear remediation path."
        />
        <ValueProp
          icon={
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
          }
          title="Track over time"
          text="Monitor your security posture with recurring scans and trend dashboards."
        />
      </div>
      <button
        onClick={onNext}
        className="px-8 py-3 bg-sand-900 hover:bg-sand-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Run your first scan
      </button>
      <button
        onClick={onSkip}
        className="mt-3 text-sm text-sand-400 hover:text-sand-600 transition-colors"
      >
        Skip and go to dashboard
      </button>
    </div>
  );
}

function ValueProp({
  icon,
  title,
  text,
}: {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly text: string;
}) {
  return (
    <div className="flex-1">
      <div className="w-9 h-9 rounded-lg bg-sand-100 border border-sand-200 flex items-center justify-center mb-2">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-sand-500"
        >
          {icon}
        </svg>
      </div>
      <h3 className="text-sm font-medium text-sand-900 mb-1">{title}</h3>
      <p className="text-xs text-sand-500 leading-relaxed">{text}</p>
    </div>
  );
}

function StepConnect({
  onScanComplete,
  onScanError,
  scanError,
  onSkip,
}: {
  readonly onScanComplete: (data: unknown) => void;
  readonly onScanError: (message: string) => void;
  readonly scanError: string | null;
  readonly onSkip: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center max-w-xl">
      <h2 className="text-xl font-semibold text-sand-900 mb-2">
        Connect your Supabase project
      </h2>
      <p className="text-sand-500 text-sm mb-6 max-w-md">
        Paste your Supabase project URL and anon key below. Your credentials are
        only used during the scan and are never stored.
      </p>

      {scanError && (
        <div className="w-full max-w-xl mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {scanError}
        </div>
      )}

      <ScanForm
        onScanComplete={onScanComplete}
        onScanError={onScanError}
      />

      <div className="mt-6 p-4 bg-sand-50 border border-sand-200 rounded-lg max-w-xl w-full">
        <p className="text-xs text-sand-500 leading-relaxed">
          <span className="font-medium text-sand-700">Where to find these:</span>{" "}
          In your Supabase dashboard, go to Settings &gt; API. The Project URL
          and anon key are under &quot;Project API keys&quot;.
        </p>
      </div>

      <button
        onClick={onSkip}
        className="mt-4 text-sm text-sand-400 hover:text-sand-600 transition-colors"
      >
        Skip for now
      </button>
    </div>
  );
}

function StepScanning() {
  return (
    <div className="flex flex-col items-center text-center max-w-md">
      <div className="w-16 h-16 mb-6 rounded-2xl bg-sand-100 border border-sand-200 flex items-center justify-center">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-sand-500 animate-spin"
        >
          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-sand-900 mb-2">
        Scanning your project...
      </h2>
      <p className="text-sand-500 text-sm">
        Checking RLS policies, storage rules, and auth configuration. This
        usually takes under 60 seconds.
      </p>
    </div>
  );
}

function StepResults({
  result,
  onNext,
}: {
  readonly result: ScanResponse;
  readonly onNext: () => void;
}) {
  return (
    <div className="w-full max-w-3xl flex flex-col items-center">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-sand-900 mb-1">
          Your scan results
        </h2>
        <p className="text-sand-500 text-sm">
          Here is what we found in your Supabase project. Each finding includes
          context and remediation steps.
        </p>
      </div>

      <ScanResults
        grade={result.grade}
        totalFindings={result.totalFindings}
        modules={result.modules}
        durationMs={result.durationMs}
        onReset={() => {}}
      />

      <button
        onClick={onNext}
        className="mt-8 px-8 py-3 bg-sand-900 hover:bg-sand-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        See what you can do next
      </button>
    </div>
  );
}

function StepNextSteps({
  scanResult,
  onFinish,
}: {
  readonly scanResult: ScanResponse | null;
  readonly onFinish: () => void;
}) {
  const hasFindings = scanResult && scanResult.totalFindings > 0;

  return (
    <div className="flex flex-col items-center text-center max-w-lg">
      <div className="w-16 h-16 mb-6 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-emerald-600"
        >
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <path d="M22 4L12 14.01l-3-3" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-sand-900 mb-3">
        You are all set!
      </h2>
      <p className="text-sand-500 text-sm leading-relaxed mb-8">
        {hasFindings
          ? `We found ${scanResult.totalFindings} finding${scanResult.totalFindings !== 1 ? "s" : ""}. Review them in your dashboard and track your progress as you fix each issue.`
          : "Your dashboard is ready. Run scans anytime to check your Supabase security posture."}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-8">
        <NextStepCard
          title="Fix findings"
          text="Each finding has remediation steps you can follow."
          href="/dashboard"
        />
        <NextStepCard
          title="Download report"
          text="Export a PDF report to share with your team."
          href="/dashboard"
        />
        <NextStepCard
          title="Upgrade to Pro"
          text="Unlock unlimited scans, scheduling, and fix tracking."
          href="/pricing"
        />
      </div>

      <button
        onClick={onFinish}
        className="px-8 py-3 bg-sand-900 hover:bg-sand-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Go to dashboard
      </button>
    </div>
  );
}

function NextStepCard({
  title,
  text,
  href,
}: {
  readonly title: string;
  readonly text: string;
  readonly href: string;
}) {
  return (
    <a
      href={href}
      className="p-4 bg-white border border-sand-200 rounded-lg text-left hover:border-sand-300 transition-colors group"
    >
      <h3 className="text-sm font-medium text-sand-900 mb-1 group-hover:text-sand-700">
        {title}
      </h3>
      <p className="text-xs text-sand-500 leading-relaxed">{text}</p>
    </a>
  );
}
