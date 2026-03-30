import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SlackWebhook, SlackScanNotificationPayload } from "./types";
import type { Grade } from "@/types/scanner";

const GRADE_EMOJI: Record<Grade, string> = {
  A: ":large_green_circle:",
  B: ":large_green_circle:",
  C: ":large_yellow_circle:",
  D: ":large_orange_circle:",
  F: ":red_circle:",
};

function gradeColor(grade: Grade): string {
  const colors: Record<Grade, string> = {
    A: "#22c55e",
    B: "#86efac",
    C: "#eab308",
    D: "#f97316",
    F: "#ef4444",
  };
  return colors[grade];
}

function buildScanCompleteBlocks(payload: SlackScanNotificationPayload): readonly Record<string, unknown>[] {
  const emoji = GRADE_EMOJI[payload.grade];
  const findings = [
    payload.criticalCount > 0 ? `*${payload.criticalCount} critical*` : null,
    payload.highCount > 0 ? `${payload.highCount} high` : null,
    payload.mediumCount > 0 ? `${payload.mediumCount} medium` : null,
    payload.lowCount > 0 ? `${payload.lowCount} low` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const summaryLine = payload.totalFindings === 0
    ? "No security findings detected."
    : `${payload.totalFindings} finding${payload.totalFindings === 1 ? "" : "s"} detected: ${findings}`;

  const degradationNote =
    payload.previousGrade &&
    payload.previousGrade !== payload.grade &&
    gradeOrdinal(payload.grade) > gradeOrdinal(payload.previousGrade)
      ? `\n:warning: Score degraded from ${payload.previousGrade} to ${payload.grade}`
      : "";

  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "SupaScanner - Scan Complete",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${emoji} *Grade: ${payload.grade}*${degradationNote}\n${summaryLine}`,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Target:*\n${payload.supabaseUrl}`,
        },
        {
          type: "mrkdwn",
          text: `*Duration:*\n${(payload.durationMs / 1000).toFixed(1)}s`,
        },
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "View Full Report", emoji: true },
          url: payload.scanUrl,
          style: "primary",
        },
      ],
    },
    { type: "divider" },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "Sent by <https://supabase-scanner.vercel.app|SupaScanner>",
        },
      ],
    },
  ];
}

function gradeOrdinal(grade: Grade | string): number {
  const ordinals: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, F: 4 };
  return ordinals[grade] ?? 5;
}

async function sendSlackMessage(
  webhookUrl: string,
  blocks: readonly Record<string, unknown>[],
  fallbackText: string,
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: fallbackText, blocks }),
    });
    return response.ok;
  } catch (err) {
    Sentry.captureException(err, {
      extra: { context: "slack_webhook_send" },
    });
    return false;
  }
}

/**
 * Fetch all enabled Slack webhooks for a user and send scan notifications.
 * Fire-and-forget: errors are captured by Sentry, never thrown.
 */
export async function notifySlackOnScanComplete(
  adminClient: SupabaseClient,
  userId: string,
  payload: SlackScanNotificationPayload,
): Promise<void> {
  const { data: webhooks } = await adminClient
    .from("slack_webhooks")
    .select("*")
    .eq("user_id", userId)
    .eq("enabled", true);

  if (!webhooks || webhooks.length === 0) return;

  const blocks = buildScanCompleteBlocks(payload);
  const fallbackText = `SupaScanner: Grade ${payload.grade} - ${payload.totalFindings} finding(s)`;

  const hasCritical = payload.criticalCount > 0;
  const hasDegradation =
    payload.previousGrade != null &&
    payload.previousGrade !== payload.grade &&
    gradeOrdinal(payload.grade) > gradeOrdinal(payload.previousGrade);

  for (const webhook of webhooks as SlackWebhook[]) {
    const shouldNotify =
      webhook.notify_scan_complete ||
      (webhook.notify_critical_finding && hasCritical) ||
      (webhook.notify_score_degradation && hasDegradation);

    if (!shouldNotify) continue;

    sendSlackMessage(webhook.webhook_url, blocks, fallbackText).catch(
      (err) => {
        Sentry.captureException(err, {
          extra: {
            context: "slack_scan_notification",
            userId,
            webhookId: webhook.id,
          },
        });
      },
    );
  }
}

/**
 * Send a test message to verify webhook connectivity.
 */
export async function sendSlackTestMessage(
  webhookUrl: string,
): Promise<boolean> {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: ":white_check_mark: *SupaScanner Slack integration is working!*\nYou will receive scan alerts in this channel.",
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "Sent by <https://supabase-scanner.vercel.app|SupaScanner>",
        },
      ],
    },
  ];

  return sendSlackMessage(
    webhookUrl,
    blocks,
    "SupaScanner Slack integration test - connection successful!",
  );
}
