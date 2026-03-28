import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { runScan } from "@/lib/scanner";
import { decrypt } from "@/lib/crypto";
import { getOrCreatePreferences, buildUnsubscribeUrl } from "@/lib/email/preferences";
import { sendScheduledScanEmail } from "@/lib/email/send";
import {
  computeNextRunAt,
  MAX_CONSECUTIVE_FAILURES,
  type ScanSchedule,
  type ScheduleFrequency,
} from "@/lib/schedules";
import type { Severity } from "@/types/scanner";

export const maxDuration = 300;

/**
 * POST /api/schedules/trigger
 * Cron-triggered endpoint that runs all due scheduled scans.
 * Protected by CRON_SECRET.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createSupabaseAdmin();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://supabase-scanner.vercel.app";

  // Fetch all enabled schedules that are due
  const { data: dueSchedules, error: fetchError } = await adminClient
    .from("scan_schedules")
    .select("*")
    .eq("enabled", true)
    .lte("next_run_at", new Date().toISOString())
    .order("next_run_at", { ascending: true })
    .limit(20);

  if (fetchError || !dueSchedules) {
    return NextResponse.json(
      { error: "Failed to fetch due schedules" },
      { status: 500 },
    );
  }

  let succeeded = 0;
  let failed = 0;
  let disabled = 0;

  for (const row of dueSchedules as ScanSchedule[]) {
    try {
      const anonKey = decrypt(row.encrypted_anon_key);
      const target = { supabaseUrl: row.supabase_url, anonKey };

      // Create scan job record
      const { data: scanJob, error: insertError } = await adminClient
        .from("scan_jobs")
        .insert({
          user_id: row.user_id,
          supabase_url: row.supabase_url,
          status: "running",
        })
        .select("id")
        .single();

      if (insertError || !scanJob) {
        throw new Error("Failed to create scan job");
      }

      const result = await runScan(target);

      // Persist findings
      if (result.totalFindings > 0) {
        const findingsRows = result.modules.flatMap((mod) =>
          mod.findings.map((f) => ({
            scan_job_id: scanJob.id,
            title: f.title,
            description: f.description,
            severity: f.severity,
            category: f.category,
            resource: f.resource,
            details: f.details,
            remediation: f.remediation,
            module: mod.module,
          })),
        );
        await adminClient.from("findings").insert(findingsRows);
      }

      // Mark scan job completed
      await adminClient
        .from("scan_jobs")
        .update({
          status: "completed",
          grade: result.grade,
          total_findings: result.totalFindings,
          duration_ms: result.durationMs,
          completed_at: result.completedAt,
        })
        .eq("id", scanJob.id);

      // Compute delta if there was a previous scan
      const delta = await computeDelta(
        adminClient,
        row.last_scan_job_id,
        scanJob.id,
      );

      // Update schedule: advance next_run_at, record success
      await adminClient
        .from("scan_schedules")
        .update({
          last_run_at: new Date().toISOString(),
          last_scan_job_id: scanJob.id,
          next_run_at: computeNextRunAt(row.frequency as ScheduleFrequency),
          consecutive_failures: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      // Send notification email
      sendScheduledScanNotification(
        adminClient,
        row.user_id,
        result,
        scanJob.id,
        delta,
        siteUrl,
      ).catch((err) => {
        Sentry.captureException(err, {
          extra: { context: "scheduled_scan_email", userId: row.user_id },
        });
      });

      succeeded++;
    } catch (err) {
      failed++;
      Sentry.captureException(err, {
        extra: { scheduleId: row.id, userId: row.user_id },
      });

      const newFailures = row.consecutive_failures + 1;
      const shouldDisable = newFailures >= MAX_CONSECUTIVE_FAILURES;

      await adminClient
        .from("scan_schedules")
        .update({
          consecutive_failures: newFailures,
          enabled: !shouldDisable,
          next_run_at: shouldDisable
            ? row.next_run_at
            : computeNextRunAt(row.frequency as ScheduleFrequency),
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (shouldDisable) {
        disabled++;
      }
    }
  }

  return NextResponse.json({
    total: dueSchedules.length,
    succeeded,
    failed,
    disabled,
  });
}

interface ScanDelta {
  readonly newFindings: number;
  readonly resolvedFindings: number;
  readonly previousGrade: string | null;
}

async function computeDelta(
  adminClient: ReturnType<typeof createSupabaseAdmin>,
  previousScanJobId: string | null,
  currentScanJobId: string,
): Promise<ScanDelta> {
  if (!previousScanJobId) {
    return { newFindings: 0, resolvedFindings: 0, previousGrade: null };
  }

  const [prevResult, currResult, prevJob] = await Promise.all([
    adminClient
      .from("findings")
      .select("title")
      .eq("scan_job_id", previousScanJobId),
    adminClient
      .from("findings")
      .select("title")
      .eq("scan_job_id", currentScanJobId),
    adminClient
      .from("scan_jobs")
      .select("grade")
      .eq("id", previousScanJobId)
      .single(),
  ]);

  const prevTitles = new Set((prevResult.data ?? []).map((f) => f.title));
  const currTitles = new Set((currResult.data ?? []).map((f) => f.title));

  const newFindings = [...currTitles].filter((t) => !prevTitles.has(t)).length;
  const resolvedFindings = [...prevTitles].filter(
    (t) => !currTitles.has(t),
  ).length;

  return {
    newFindings,
    resolvedFindings,
    previousGrade: prevJob.data?.grade ?? null,
  };
}

async function sendScheduledScanNotification(
  adminClient: ReturnType<typeof createSupabaseAdmin>,
  userId: string,
  result: Awaited<ReturnType<typeof runScan>>,
  scanJobId: string,
  delta: ScanDelta,
  siteUrl: string,
): Promise<void> {
  const prefs = await getOrCreatePreferences(adminClient, userId);
  if (!prefs.scheduled_scan_email) return;

  const { data: userData } = await adminClient.auth.admin.getUserById(userId);
  if (!userData?.user?.email) return;

  const allFindings = result.modules.flatMap((m) => m.findings);
  const countBySeverity = (s: Severity) =>
    allFindings.filter((f) => f.severity === s).length;

  await sendScheduledScanEmail(userData.user.email, {
    userName: userData.user.email.split("@")[0] ?? "there",
    grade: result.grade,
    totalFindings: result.totalFindings,
    criticalCount: countBySeverity("critical"),
    highCount: countBySeverity("high"),
    mediumCount: countBySeverity("medium"),
    lowCount: countBySeverity("low"),
    newFindings: delta.newFindings,
    resolvedFindings: delta.resolvedFindings,
    previousGrade: delta.previousGrade,
    scanUrl: `${siteUrl}/scan/${scanJobId}`,
    dashboardUrl: `${siteUrl}/dashboard`,
    unsubscribeUrl: buildUnsubscribeUrl(prefs.unsubscribe_token),
  });
}
