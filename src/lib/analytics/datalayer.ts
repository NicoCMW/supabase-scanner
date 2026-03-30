declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

function pushEvent(event: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

export function trackScanInitiated(
  scanType: "free" | "pro",
  scanSource: "landing_page" | "dashboard" | "api",
): void {
  pushEvent({
    event: "scan_initiated",
    scan_type: scanType,
    scan_source: scanSource,
  });
}

export function trackScanCompleted(
  scanType: "free" | "pro",
  scanGrade: string,
  issuesFound: number,
  criticalIssues: number,
): void {
  pushEvent({
    event: "scan_completed",
    scan_type: scanType,
    scan_grade: scanGrade,
    issues_found: issuesFound,
    critical_issues: criticalIssues,
  });
}

export function trackAccountCreated(
  method: "email" | "github" | "google",
  userIdHash: string,
): void {
  pushEvent({
    event: "account_created",
    method,
    user_id_hash: userIdHash,
  });
}

export function trackPageView(): void {
  pushEvent({
    event: "page_view",
    page_path: window.location.pathname,
    page_title: document.title,
  });
}

export function trackCheckoutStarted(
  planName: string,
  planPrice: number,
): void {
  pushEvent({
    event: "checkout_started",
    plan_name: planName,
    plan_price: planPrice,
  });
}

export function trackCheckoutCompleted(
  planName: string,
  transactionId: string,
): void {
  pushEvent({
    event: "checkout_completed",
    plan_name: planName,
    transaction_id: transactionId,
  });
}

export function trackScheduleCreated(
  frequency: string,
): void {
  pushEvent({
    event: "schedule_created",
    frequency,
  });
}

export function trackTeamCreated(): void {
  pushEvent({
    event: "team_created",
  });
}

export function trackReferralShared(): void {
  pushEvent({
    event: "referral_shared",
  });
}

export function trackScanShared(): void {
  pushEvent({
    event: "scan_shared",
  });
}

export function trackOnboardingStepViewed(step: number, stepName: string): void {
  pushEvent({
    event: "onboarding_step_viewed",
    onboarding_step: step,
    onboarding_step_name: stepName,
  });
}

export function trackOnboardingCompleted(): void {
  pushEvent({
    event: "onboarding_completed",
  });
}

export function trackOnboardingSkipped(atStep: number): void {
  pushEvent({
    event: "onboarding_skipped",
    onboarding_step: atStep,
  });
}

export function trackRemediationSnippetCopied(
  findingCategory: string,
  snippetLabel: string,
  findingTitle: string,
): void {
  pushEvent({
    event: "remediation_snippet_copied",
    finding_category: findingCategory,
    snippet_label: snippetLabel,
    finding_title: findingTitle,
  });
}
