import * as Sentry from "@sentry/nextjs";
import { createHmac } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Webhook, WebhookScanPayload } from "./types";
import type { Grade } from "@/types/scanner";

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

function gradeOrdinal(grade: Grade | string): number {
  const ordinals: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, F: 4 };
  return ordinals[grade] ?? 5;
}

function computeHmacSignature(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

async function deliverWithRetry(
  adminClient: SupabaseClient,
  webhook: Webhook,
  payload: WebhookScanPayload,
  scanJobId: string | null,
): Promise<void> {
  const body = JSON.stringify(payload);
  const signature = computeHmacSignature(webhook.secret, body);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let responseStatus: number | null = null;
    let responseBody: string | null = null;
    let errorMessage: string | null = null;
    let success = false;

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": `sha256=${signature}`,
          "X-Webhook-Id": webhook.id,
          "X-Webhook-Event": payload.event,
          "X-Webhook-Attempt": String(attempt),
          "User-Agent": "SupaScanner-Webhook/1.0",
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });

      responseStatus = response.status;
      responseBody = await response.text().catch(() => null);
      success = response.ok;
    } catch (err) {
      errorMessage =
        err instanceof Error ? err.message : "Unknown delivery error";
    }

    // Log delivery attempt
    await adminClient
      .from("webhook_delivery_logs")
      .insert({
        webhook_id: webhook.id,
        scan_job_id: scanJobId,
        event_type: payload.event,
        request_url: webhook.url,
        request_body: payload,
        response_status: responseStatus,
        response_body: responseBody,
        success,
        attempt,
        error_message: errorMessage,
      })
      .then(undefined, (logErr: unknown) => {
        Sentry.captureException(logErr, {
          extra: { context: "webhook_delivery_log_insert", webhookId: webhook.id },
        });
      });

    if (success) return;

    // Don't retry on 4xx (client errors) - only retry on 5xx or network errors
    if (responseStatus !== null && responseStatus >= 400 && responseStatus < 500) {
      return;
    }

    if (attempt < MAX_RETRIES) {
      const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
}

export interface WebhookNotificationInput {
  readonly grade: Grade;
  readonly totalFindings: number;
  readonly criticalCount: number;
  readonly highCount: number;
  readonly mediumCount: number;
  readonly lowCount: number;
  readonly scanUrl: string;
  readonly supabaseUrl: string;
  readonly durationMs: number;
  readonly scanJobId: string;
  readonly previousGrade?: Grade | null;
}

/**
 * Fetch all enabled webhooks for a user and deliver scan completion payloads.
 * Fire-and-forget: errors are captured by Sentry, never thrown.
 */
export async function notifyWebhooksOnScanComplete(
  adminClient: SupabaseClient,
  userId: string,
  input: WebhookNotificationInput,
): Promise<void> {
  const { data: webhooks } = await adminClient
    .from("webhooks")
    .select("*")
    .eq("user_id", userId)
    .eq("enabled", true);

  if (!webhooks || webhooks.length === 0) return;

  const hasCritical = input.criticalCount > 0;
  const hasDegradation =
    input.previousGrade != null &&
    input.previousGrade !== input.grade &&
    gradeOrdinal(input.grade) > gradeOrdinal(input.previousGrade);

  const payload: WebhookScanPayload = {
    event: "scan.completed",
    timestamp: new Date().toISOString(),
    data: {
      scanJobId: input.scanJobId,
      grade: input.grade,
      totalFindings: input.totalFindings,
      criticalCount: input.criticalCount,
      highCount: input.highCount,
      mediumCount: input.mediumCount,
      lowCount: input.lowCount,
      supabaseUrl: input.supabaseUrl,
      scanUrl: input.scanUrl,
      durationMs: input.durationMs,
      previousGrade: input.previousGrade ?? null,
    },
  };

  for (const webhook of webhooks as Webhook[]) {
    const shouldNotify =
      webhook.notify_scan_complete ||
      (webhook.notify_critical_finding && hasCritical) ||
      (webhook.notify_score_degradation && hasDegradation);

    if (!shouldNotify) continue;

    deliverWithRetry(adminClient, webhook, payload, input.scanJobId).catch(
      (err) => {
        Sentry.captureException(err, {
          extra: {
            context: "webhook_scan_notification",
            userId,
            webhookId: webhook.id,
          },
        });
      },
    );
  }
}

/**
 * Send a test payload to verify webhook connectivity.
 */
export async function sendWebhookTestMessage(
  url: string,
  secret: string,
): Promise<boolean> {
  const payload: WebhookScanPayload = {
    event: "scan.completed",
    timestamp: new Date().toISOString(),
    data: {
      scanJobId: "00000000-0000-0000-0000-000000000000",
      grade: "A",
      totalFindings: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      supabaseUrl: "https://example.supabase.co",
      scanUrl: "https://supabase-scanner.vercel.app/scan/test",
      durationMs: 1234,
      previousGrade: null,
    },
  };

  const body = JSON.stringify(payload);
  const signature = computeHmacSignature(secret, body);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": `sha256=${signature}`,
        "X-Webhook-Event": "scan.completed",
        "X-Webhook-Attempt": "1",
        "User-Agent": "SupaScanner-Webhook/1.0 (test)",
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    return response.ok;
  } catch (err) {
    Sentry.captureException(err, {
      extra: { context: "webhook_test_send" },
    });
    return false;
  }
}
