import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { runScan, validateTarget } from "@/lib/scanner";
import { checkScanAllowed, incrementUsage } from "@/lib/billing/usage";
import {
  requireTeamRole,
  isTeamMembership,
} from "@/lib/teams/auth";
import type { ScanTarget } from "@/types/scanner";

export const maxDuration = 60;

interface RouteContext {
  readonly params: Promise<{ teamId: string; projectId: string }>;
}

/**
 * POST /api/teams/:teamId/projects/:projectId/scan
 * Trigger a scan for a team project. Uses the scanning user's plan/usage.
 * Requires admin/member role.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { teamId, projectId } = await context.params;
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

  const roleResult = await requireTeamRole(supabase, teamId, user.id, [
    "admin",
    "member",
  ]);
  if (!isTeamMembership(roleResult)) {
    return roleResult;
  }

  // Verify project exists and belongs to team
  const { data: project } = await supabase
    .from("team_projects")
    .select("id, supabase_url")
    .eq("id", projectId)
    .eq("team_id", teamId)
    .single();

  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 },
    );
  }

  // Check usage limits against the scanning user's plan
  const { allowed, reason, usage } = await checkScanAllowed(
    supabase,
    user.id,
  );

  if (!allowed) {
    return NextResponse.json(
      { error: reason, usage },
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

  const { anonKey } = body as Record<string, unknown>;

  if (typeof anonKey !== "string") {
    return NextResponse.json(
      { error: "Missing required field: anonKey" },
      { status: 400 },
    );
  }

  const target: ScanTarget = {
    supabaseUrl: project.supabase_url,
    anonKey: anonKey.trim(),
  };

  const validation = validateTarget(target);
  if (!validation.valid) {
    return NextResponse.json(
      { error: "Invalid scan target", details: validation.errors },
      { status: 422 },
    );
  }

  // Create scan job linked to team project
  const { data: scanJob, error: insertError } = await supabase
    .from("scan_jobs")
    .insert({
      user_id: user.id,
      supabase_url: target.supabaseUrl,
      status: "running",
      team_project_id: projectId,
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

    // Update team project with latest scan info
    await supabase
      .from("team_projects")
      .update({
        last_scan_grade: result.grade,
        last_scan_at: result.completedAt,
        last_scan_job_id: scanJob.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    // Increment usage
    const adminClient = createSupabaseAdmin();
    await incrementUsage(adminClient, user.id);

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
      extra: { scanJobId: scanJob.id, userId: user.id, teamId, projectId },
    });

    await supabase
      .from("scan_jobs")
      .update({ status: "failed" })
      .eq("id", scanJob.id);

    const message =
      error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
