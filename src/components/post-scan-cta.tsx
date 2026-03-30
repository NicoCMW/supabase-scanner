import { isBillingEnabled } from "@/lib/billing/config";
import { WaitlistForm } from "@/components/waitlist-form";
import type { Grade, FindingCategory } from "@/types/scanner";

const billingEnabled = isBillingEnabled();

interface PostScanCtaProps {
  readonly totalFindings: number;
  readonly grade: Grade;
  readonly criticalCount: number;
  readonly highCount: number;
  readonly mediumCount: number;
  readonly lowCount: number;
  readonly categories: readonly FindingCategory[];
}

interface Nudge {
  readonly headline: string;
  readonly body: string;
  readonly accent: string;
  readonly border: string;
  readonly bg: string;
}

function buildNudges({
  grade,
  criticalCount,
  highCount,
  totalFindings,
  categories,
}: PostScanCtaProps): readonly Nudge[] {
  const nudges: Nudge[] = [];

  if (criticalCount > 0) {
    nudges.push({
      headline: `Unlock automated remediation for ${criticalCount} critical issue${criticalCount !== 1 ? "s" : ""}`,
      body: "Pro includes step-by-step fix scripts and SQL snippets you can apply directly -- no guesswork.",
      accent: "text-red-900",
      border: "border-red-200",
      bg: "bg-red-50",
    });
  }

  if (highCount > 0 && nudges.length < 2) {
    nudges.push({
      headline: `Set up recurring scans to track ${highCount} high-severity finding${highCount !== 1 ? "s" : ""}`,
      body: "Schedule daily or weekly scans so regressions never slip through unnoticed.",
      accent: "text-orange-900",
      border: "border-orange-200",
      bg: "bg-orange-50",
    });
  }

  if ((grade === "D" || grade === "F") && nudges.length < 2) {
    nudges.push({
      headline: `Your project scored a ${grade} -- Pro can help you get to an A`,
      body: "Track fixes over time with a dedicated dashboard and get alerted the moment your grade drops.",
      accent: "text-amber-900",
      border: "border-amber-200",
      bg: "bg-amber-50",
    });
  }

  if (categories.includes("rls") && nudges.length < 2) {
    nudges.push({
      headline: "RLS issues detected -- fix them before they ship",
      body: "Pro highlights exactly which tables and policies need attention, with copy-paste SQL fixes.",
      accent: "text-amber-900",
      border: "border-amber-200",
      bg: "bg-amber-50",
    });
  }

  if (nudges.length === 0 && totalFindings > 0) {
    nudges.push({
      headline: `Found ${totalFindings} issue${totalFindings !== 1 ? "s" : ""} -- stay on top of them`,
      body: "Upgrade to Pro for unlimited scans, scheduled monitoring, and fix tracking so nothing slips through the cracks.",
      accent: "text-amber-900",
      border: "border-amber-200",
      bg: "bg-amber-50",
    });
  }

  return nudges;
}

export function PostScanCta(props: PostScanCtaProps) {
  if (props.totalFindings === 0) return null;

  if (!billingEnabled) {
    return (
      <div className="w-full max-w-3xl p-5 bg-amber-50 border border-amber-200 rounded-xl mt-6">
        <p className="text-sm font-medium text-amber-900 mb-1">
          Found {props.totalFindings} security issue
          {props.totalFindings !== 1 ? "s" : ""}
        </p>
        <p className="text-sm text-amber-700 mb-4">
          Pro is coming soon with unlimited scans, scheduled monitoring, and fix
          tracking. Enter your email for early access:
        </p>
        <WaitlistForm />
      </div>
    );
  }

  const nudges = buildNudges(props);

  return (
    <div className="w-full max-w-3xl mt-6 space-y-3">
      {nudges.map((nudge) => (
        <div
          key={nudge.headline}
          className={`p-5 ${nudge.bg} border ${nudge.border} rounded-xl flex items-start justify-between gap-4`}
        >
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${nudge.accent} mb-1`}>
              {nudge.headline}
            </p>
            <p className="text-sm text-sand-500">{nudge.body}</p>
          </div>
          <a
            href="/pricing"
            className="shrink-0 px-4 py-2 bg-sand-900 hover:bg-sand-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Upgrade to Pro
          </a>
        </div>
      ))}
    </div>
  );
}
