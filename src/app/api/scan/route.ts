import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { runScan, validateTarget } from "@/lib/scanner";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { checkScanAllowed, incrementUsage } from "@/lib/billing/usage";
import { isStripeConfigured } from "@/lib/billing/config";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { getOrCreatePreferences, buildUnsubscribeUrl } from "@/lib/email/preferences";
import { sendScanResultsEmail } from "@/lib/email/send";
import type { ScanTarget, Severity } from "@/types/scanner";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  // Rate limit: prevent request flooding independent of usage quotas
  const adminClient = createSupabaseAdmin();
  const rateLimitAllowed = await checkRateLimit(
    adminClient,
    `scan:${user.id}`,
    RATE_LIMITS.scan,
  );
  if (!rateLimitAllowed) return rateLimitResponse();

  // Check usage limits before proceeding
  const { allowed, reason, usage } = await checkScanAllowed(
    supabase,
    user.id,
  );

  if (!allowed) {
    const message = isStripeConfigured()
      ? reason
      : `Monthly scan limit reached (${usage.scansUsed}/${usage.scansLimit}). Pro is coming soon -- enter your email on the pricing page for early access.`;
    return NextResponse.json(
      { error: message, usage },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { supabaseUrl, anonKey } = body as Record<string, unknown>;

  if (typeof supabaseUrl !== "string" || typeof anonKey !== "string") {
    return NextResponse.json(
      { error: "Missing required fields: supabaseUrl, anonKey" },
      { status: 400 },
    );
  }

  const target: ScanTarget = {
    supabaseUrl: supabaseUrl.trim().replace(/\/+$/, ""),
    anonKey: anonKey.trim(),
  };

  const validation = validateTarget(target);
  if (!validation.valid) {
    return NextResponse.json(
      { error: "Invalid scan target", details: validation.errors },
      { status: 422 },
    );
  }

  // Create scan job record
  const { data: scanJob, error: insertError } = await supabase
    .from("scan_jobs")
    .insert({
      user_id: user.id,
      supabase_url: target.supabaseUrl,
      status: "running",
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to create scan job" },
      { status: 500 },
    );
  }

  try {
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

      await supabase.from("findings").insert(findingsRows);
    }

    // Update scan job as completed
    await supabase
      .from("scan_jobs")
      .update({
        status: "completed",
        grade: result.grade,
        total_findings: result.totalFindings,
        duration_ms: result.durationMs,
        completed_at: result.completedAt,
      })
      .eq("id", scanJob.id);

    // Increment usage counter after successful scan (service role bypasses RLS)
    const adminClient = createSupabaseAdmin();
    await incrementUsage(adminClient, user.id);

    // Send scan results email (fire-and-forget, don't block response)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://supabase-scanner.vercel.app";
    getOrCreatePreferences(adminClient, user.id)
      .then((prefs) => {
        if (!prefs.scan_results_email) return;

        const allFindings = result.modules.flatMap((m) => m.findings);
        const countBySeverity = (s: Severity) =>
          allFindings.filter((f) => f.severity === s).length;

        return sendScanResultsEmail(user.email ?? "", {
          userName: user.email?.split("@")[0] ?? "there",
          grade: result.grade,
          totalFindings: result.totalFindings,
          criticalCount: countBySeverity("critical"),
          highCount: countBySeverity("high"),
          mediumCount: countBySeverity("medium"),
          lowCount: countBySeverity("low"),
          scanUrl: `${siteUrl}/scan/${scanJob.id}`,
          unsubscribeUrl: buildUnsubscribeUrl(prefs.unsubscribe_token),
        });
      })
      .catch((err) => {
        Sentry.captureException(err, {
          extra: { context: "scan_results_email", userId: user.id },
        });
      });

    return NextResponse.json({
      scanJobId: scanJob.id,
      grade: result.grade,
      totalFindings: result.totalFindings,
      modules: result.modules,
      durationMs: result.durationMs,
      startedAt: result.startedAt,
      completedAt: result.completedAt,
    });
  } catch (error) {
    Sentry.captureException(error, {
      extra: { scanJobId: scanJob.id, userId: user.id },
    });

    // Mark scan job as failed
    await supabase
      .from("scan_jobs")
      .update({ status: "failed" })
      .eq("id", scanJob.id);

    const message =
      error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
