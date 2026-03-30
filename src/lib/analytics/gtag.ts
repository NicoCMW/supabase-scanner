export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

type GTagEvent = {
  readonly action: string;
  readonly category?: string;
  readonly label?: string;
  readonly value?: number;
};

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

export function pageview(url: string): void {
  if (!GA_MEASUREMENT_ID) return;
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
}

export function trackEvent({ action, category, label, value }: GTagEvent): void {
  if (!GA_MEASUREMENT_ID) return;
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value,
  });
}

export function trackScanStarted(): void {
  trackEvent({ action: "scan_started", category: "engagement" });
}

export function trackScanCompleted(grade: string, totalFindings: number, durationMs: number): void {
  trackEvent({
    action: "scan_completed",
    category: "engagement",
    label: grade,
    value: totalFindings,
  });
  trackEvent({
    action: "scan_duration",
    category: "performance",
    value: durationMs,
  });
}

export function trackSignup(): void {
  trackEvent({ action: "sign_up", category: "acquisition" });
}

export function trackUpgradeToPro(): void {
  trackEvent({ action: "upgrade_to_pro", category: "monetization" });
}

export function trackOnboardingStep(step: number, stepName: string): void {
  trackEvent({
    action: "onboarding_step_viewed",
    category: "onboarding",
    label: stepName,
    value: step,
  });
}

export function trackOnboardingCompleted(): void {
  trackEvent({ action: "onboarding_completed", category: "onboarding" });
}

export function trackOnboardingSkipped(atStep: number): void {
  trackEvent({
    action: "onboarding_skipped",
    category: "onboarding",
    value: atStep,
  });
}

export function trackRemediationCopied(findingCategory: string, snippetLabel: string): void {
  trackEvent({
    action: "remediation_copied",
    category: "engagement",
    label: `${findingCategory}:${snippetLabel}`,
  });
}

export function trackRemediationViewed(findingCategory: string): void {
  trackEvent({
    action: "remediation_viewed",
    category: "engagement",
    label: findingCategory,
  });
}

export function trackRemediationUpgradePrompt(findingCategory: string): void {
  trackEvent({
    action: "remediation_upgrade_prompt",
    category: "monetization",
    label: findingCategory,
  });
}
