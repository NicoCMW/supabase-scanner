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
