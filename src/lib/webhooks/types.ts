import type { Grade, Severity } from "@/types/scanner";

export interface Webhook {
  readonly id: string;
  readonly user_id: string;
  readonly project_id: string | null;
  readonly label: string;
  readonly url: string;
  readonly secret: string;
  readonly enabled: boolean;
  readonly notify_scan_complete: boolean;
  readonly notify_critical_finding: boolean;
  readonly notify_score_degradation: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface WebhookScanPayload {
  readonly event: "scan.completed";
  readonly timestamp: string;
  readonly data: {
    readonly scanJobId: string;
    readonly grade: Grade;
    readonly totalFindings: number;
    readonly criticalCount: number;
    readonly highCount: number;
    readonly mediumCount: number;
    readonly lowCount: number;
    readonly supabaseUrl: string;
    readonly scanUrl: string;
    readonly durationMs: number;
    readonly previousGrade?: Grade | null;
  };
}

export interface WebhookDeliveryLog {
  readonly id: string;
  readonly webhook_id: string;
  readonly scan_job_id: string | null;
  readonly event_type: string;
  readonly request_url: string;
  readonly request_body: WebhookScanPayload;
  readonly response_status: number | null;
  readonly response_body: string | null;
  readonly success: boolean;
  readonly attempt: number;
  readonly error_message: string | null;
  readonly created_at: string;
}
