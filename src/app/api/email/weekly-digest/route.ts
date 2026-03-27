import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { buildUnsubscribeUrl } from "@/lib/email/preferences";
import { sendWeeklyDigestEmail } from "@/lib/email/send";
import type { FindingSummary } from "@/lib/email/types";

/**
 * POST /api/email/weekly-digest
 * Protected by CRON_SECRET. Intended to be called by Vercel Cron or similar scheduler.
 * Sends weekly digest emails to all users with weekly_digest_email enabled.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createSupabaseAdmin();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://supascanner.com";

  // Get all users with weekly digest enabled
  const { data: preferences, error: prefsError } = await adminClient
    .from("email_preferences")
    .select("user_id, unsubscribe_token")
    .eq("weekly_digest_email", true);

  if (prefsError || !preferences) {
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 },
    );
  }

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekStart = oneWeekAgo.toISOString();

  let sent = 0;
  let failed = 0;

  for (const pref of preferences) {
    try {
      // Get user email
      const { data: userData } = await adminClient.auth.admin.getUserById(
        pref.user_id,
      );
      if (!userData?.user?.email) continue;

      // Get scans from the past week
      const { data: scans } = await adminClient
        .from("scan_jobs")
        .select("id, grade, total_findings, status")
        .eq("user_id", pref.user_id)
        .eq("status", "completed")
        .gte("created_at", weekStart);

      const totalScans = scans?.length ?? 0;

      // Calculate average grade
      const gradeValues: Record<string, number> = {
        A: 4,
        B: 3,
        C: 2,
        D: 1,
        F: 0,
      };
      const gradeLabels = ["F", "D", "C", "B", "A"];
      const grades = (scans ?? [])
        .map((s) => s.grade)
        .filter((g): g is string => g !== null);
      const avgGradeNum =
        grades.length > 0
          ? grades.reduce((sum, g) => sum + (gradeValues[g] ?? 0), 0) /
            grades.length
          : 0;
      const averageGrade =
        grades.length > 0 ? (gradeLabels[Math.round(avgGradeNum)] ?? "N/A") : "N/A";

      // Get findings from scans this week
      const scanIds = (scans ?? []).map((s) => s.id);
      let topFindings: readonly FindingSummary[] = [];
      let newFindings = 0;

      if (scanIds.length > 0) {
        const { data: findings } = await adminClient
          .from("findings")
          .select("title, severity, category")
          .in("scan_job_id", scanIds)
          .order("severity", { ascending: true })
          .limit(5);

        topFindings = (findings ?? []).map((f) => ({
          title: f.title,
          severity: f.severity,
          category: f.category,
        }));

        const { count } = await adminClient
          .from("findings")
          .select("id", { count: "exact", head: true })
          .in("scan_job_id", scanIds);

        newFindings = count ?? 0;
      }

      const result = await sendWeeklyDigestEmail(userData.user.email, {
        userName: userData.user.email.split("@")[0],
        totalScans,
        averageGrade,
        newFindings,
        resolvedFindings: 0,
        topFindings,
        dashboardUrl: `${siteUrl}/dashboard`,
        unsubscribeUrl: buildUnsubscribeUrl(pref.unsubscribe_token),
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    } catch (err) {
      failed++;
      Sentry.captureException(err, {
        extra: { context: "weekly_digest", userId: pref.user_id },
      });
    }
  }

  return NextResponse.json({
    total: preferences.length,
    sent,
    failed,
  });
}
