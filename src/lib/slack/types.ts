import type { Grade, Severity } from "@/types/scanner";

export interface SlackWebhook {
  readonly id: string;
  readonly user_id: string;
  readonly team_id: string | null;
  readonly label: string;
  readonly webhook_url: string;
  readonly channel_name: string | null;
  readonly enabled: boolean;
  readonly notify_scan_complete: boolean;
  readonly notify_critical_finding: boolean;
  readonly notify_score_degradation: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface SlackScanNotificationPayload {
  readonly grade: Grade;
  readonly totalFindings: number;
  readonly criticalCount: number;
  readonly highCount: number;
  readonly mediumCount: number;
  readonly lowCount: number;
  readonly scanUrl: string;
  readonly supabaseUrl: string;
  readonly durationMs: number;
  readonly previousGrade?: Grade | null;
}
