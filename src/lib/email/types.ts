import type { Grade, Severity } from "@/types/scanner";

export interface WelcomeEmailProps {
  readonly userName: string;
  readonly unsubscribeUrl: string;
}

export interface ScanResultsEmailProps {
  readonly userName: string;
  readonly grade: Grade;
  readonly totalFindings: number;
  readonly criticalCount: number;
  readonly highCount: number;
  readonly mediumCount: number;
  readonly lowCount: number;
  readonly scanUrl: string;
  readonly unsubscribeUrl: string;
}

export interface FindingSummary {
  readonly title: string;
  readonly severity: Severity;
  readonly category: string;
}

export interface WeeklyDigestEmailProps {
  readonly userName: string;
  readonly totalScans: number;
  readonly averageGrade: string;
  readonly newFindings: number;
  readonly resolvedFindings: number;
  readonly topFindings: readonly FindingSummary[];
  readonly dashboardUrl: string;
  readonly unsubscribeUrl: string;
}

export interface ScheduledScanEmailProps {
  readonly userName: string;
  readonly grade: Grade;
  readonly totalFindings: number;
  readonly criticalCount: number;
  readonly highCount: number;
  readonly mediumCount: number;
  readonly lowCount: number;
  readonly newFindings: number;
  readonly resolvedFindings: number;
  readonly previousGrade: string | null;
  readonly scanUrl: string;
  readonly dashboardUrl: string;
  readonly unsubscribeUrl: string;
}

export interface EmailPreferences {
  readonly id: string;
  readonly user_id: string;
  readonly welcome_email: boolean;
  readonly scan_results_email: boolean;
  readonly weekly_digest_email: boolean;
  readonly scheduled_scan_email: boolean;
  readonly unsubscribe_token: string;
  readonly created_at: string;
  readonly updated_at: string;
}
