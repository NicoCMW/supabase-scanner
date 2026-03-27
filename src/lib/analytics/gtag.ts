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
