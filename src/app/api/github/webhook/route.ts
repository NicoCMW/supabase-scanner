import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { verifyWebhookSignature } from "@/lib/github-app/verify";
import { isGitHubAppConfigured } from "@/lib/github-app/auth";
import { getInstallationToken } from "@/lib/github-app/auth";
import { hasSupabaseChanges } from "@/lib/github-app/files";
import { fetchRepoConfig } from "@/lib/github-app/config";
import { formatPrComment, upsertPrComment } from "@/lib/github-app/comments";
import { runScan, validateTarget } from "@/lib/scanner";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";
import type { ScanTarget } from "@/types/scanner";

export const maxDuration = 60;

const FREE_SCANS_PER_MONTH = 3;

interface PullRequestEvent {
  readonly action: string;
  readonly installation?: { readonly id: number };
  readonly pull_request: {
    readonly number: number;
    readonly head: { readonly sha: string; readonly ref: string };
  };
  readonly repository: {
    readonly full_name: string;
  };
}

interface InstallationEvent {
  readonly action: string;
  readonly installation: {
    readonly id: number;
    readonly account: {
      readonly login: string;
      readonly type: string;
    };
  };
}

export async function POST(request: NextRequest) {
  if (!isGitHubAppConfigured()) {
    return NextResponse.json(
      { error: "GitHub App not configured" },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 },
    );
  }

  const event = request.headers.get("x-github-event");

  try {
    if (event === "pull_request") {
      return await handlePullRequest(JSON.parse(rawBody) as PullRequestEvent);
    }

    if (event === "installation") {
      return await handleInstallation(
        JSON.parse(rawBody) as InstallationEvent,
      );
    }

    // Acknowledge other events silently
    return NextResponse.json({ ok: true });
  } catch (error) {
    Sentry.captureException(error, {
      extra: { event, body: rawBody.slice(0, 500) },
    });
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 },
    );
  }
}

async function handlePullRequest(
  payload: PullRequestEvent,
): Promise<NextResponse> {
  const { action, installation, pull_request: pr, repository } = payload;

  // Only handle opened and synchronize (new push to PR branch)
  if (action !== "opened" && action !== "synchronize") {
    return NextResponse.json({ ok: true, skipped: "irrelevant action" });
  }

  if (!installation) {
    return NextResponse.json({ ok: true, skipped: "no installation" });
  }

  const installationId = installation.id;
  const repoFullName = repository.full_name;
  const prNumber = pr.number;
  const headSha = pr.head.sha;
  const headRef = pr.head.ref;

  // Check if PR touches Supabase-related files
  const changedFiles = await fetchPrFiles(installationId, repoFullName, prNumber);
  if (!hasSupabaseChanges(changedFiles)) {
    return NextResponse.json({ ok: true, skipped: "no supabase changes" });
  }

  const adminClient = createSupabaseAdmin();

  // Look up installation in our database
  const { data: inst } = await adminClient
    .from("github_installations")
    .select("*")
    .eq("installation_id", installationId)
    .single();

  if (!inst || !inst.enabled) {
    return NextResponse.json({ ok: true, skipped: "installation not found or disabled" });
  }

  // Check for dedup (already scanned this SHA)
  const { data: existingScan } = await adminClient
    .from("github_pr_scans")
    .select("id")
    .eq("installation_id", installationId)
    .eq("repo_full_name", repoFullName)
    .eq("pr_number", prNumber)
    .eq("head_sha", headSha)
    .maybeSingle();

  if (existingScan) {
    return NextResponse.json({ ok: true, skipped: "already scanned" });
  }

  // Check usage limits (free tier: 3/month)
  const canScan = await checkInstallationUsage(adminClient, inst);
  if (!canScan) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://supabase-scanner.vercel.app";
    const body = [
      "<!-- supascanner-pr-scan -->",
      "## SupaScanner -- Monthly Limit Reached",
      "",
      `Your free plan includes ${FREE_SCANS_PER_MONTH} PR scans per month.`,
      `[Upgrade to Pro](${siteUrl}/pricing) for unlimited PR scans.`,
    ].join("\n");

    await upsertPrComment(installationId, repoFullName, prNumber, body);
    return NextResponse.json({ ok: true, skipped: "usage limit" });
  }

  // Resolve scan target: config file > installation settings
  const repoConfig = await fetchRepoConfig(installationId, repoFullName, headRef);

  const supabaseUrl =
    repoConfig?.supabase?.url ?? inst.supabase_url;
  const anonKey = repoConfig?.supabase?.anon_key
    ?? (inst.encrypted_anon_key ? decrypt(inst.encrypted_anon_key) : null);

  if (!supabaseUrl || !anonKey) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://supabase-scanner.vercel.app";
    const body = [
      "<!-- supascanner-pr-scan -->",
      "## SupaScanner -- Configuration Required",
      "",
      "No Supabase project configured. Add a `.supascanner.yml` to your repo:",
      "",
      "```yaml",
      "supabase:",
      "  url: https://your-project.supabase.co",
      "  anon_key: your-anon-key",
      "```",
      "",
      `Or configure it in your [dashboard](${siteUrl}/dashboard/github).`,
    ].join("\n");

    await upsertPrComment(installationId, repoFullName, prNumber, body);
    return NextResponse.json({ ok: true, skipped: "not configured" });
  }

  const target: ScanTarget = {
    supabaseUrl: supabaseUrl.trim().replace(/\/+$/, ""),
    anonKey: anonKey.trim(),
  };

  const validation = validateTarget(target);
  if (!validation.valid) {
    const body = [
      "<!-- supascanner-pr-scan -->",
      "## SupaScanner -- Invalid Configuration",
      "",
      "Your Supabase configuration is invalid:",
      ...validation.errors.map((e) => `- ${e}`),
      "",
      "Please check your `.supascanner.yml` or dashboard settings.",
    ].join("\n");

    await upsertPrComment(installationId, repoFullName, prNumber, body);
    return NextResponse.json({ ok: true, skipped: "invalid config" });
  }

  // Run the scan
  const result = await runScan(target);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://supabase-scanner.vercel.app";

  // Persist scan job if user is linked
  let scanJobId: string | undefined;
  if (inst.user_id) {
    const { data: scanJob } = await adminClient
      .from("scan_jobs")
      .insert({
        user_id: inst.user_id,
        supabase_url: target.supabaseUrl,
        status: "completed",
        grade: result.grade,
        total_findings: result.totalFindings,
        duration_ms: result.durationMs,
        completed_at: result.completedAt,
      })
      .select("id")
      .single();

    scanJobId = scanJob?.id;

    // Persist findings
    if (scanJobId && result.totalFindings > 0) {
      const rows = result.modules.flatMap((mod) =>
        mod.findings.map((f) => ({
          scan_job_id: scanJobId,
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
      await adminClient.from("findings").insert(rows);
    }
  }

  // Post PR comment
  const commentBody = formatPrComment(result, siteUrl, scanJobId);
  const commentId = await upsertPrComment(
    installationId,
    repoFullName,
    prNumber,
    commentBody,
  );

  // Record PR scan for dedup and history
  await adminClient.from("github_pr_scans").insert({
    installation_id: installationId,
    repo_full_name: repoFullName,
    pr_number: prNumber,
    head_sha: headSha,
    comment_id: commentId,
    scan_job_id: scanJobId ?? null,
    grade: result.grade,
    total_findings: result.totalFindings,
  });

  // Increment usage counter
  await incrementInstallationUsage(adminClient, inst);

  return NextResponse.json({
    ok: true,
    grade: result.grade,
    totalFindings: result.totalFindings,
  });
}

async function handleInstallation(
  payload: InstallationEvent,
): Promise<NextResponse> {
  const { action, installation } = payload;
  const adminClient = createSupabaseAdmin();

  if (action === "created") {
    // Record new installation
    await adminClient.from("github_installations").upsert(
      {
        installation_id: installation.id,
        account_login: installation.account.login,
        account_type: installation.account.type,
        enabled: true,
      },
      { onConflict: "installation_id" },
    );
  }

  if (action === "deleted" || action === "suspend") {
    await adminClient
      .from("github_installations")
      .update({ enabled: false })
      .eq("installation_id", installation.id);
  }

  if (action === "unsuspend") {
    await adminClient
      .from("github_installations")
      .update({ enabled: true })
      .eq("installation_id", installation.id);
  }

  return NextResponse.json({ ok: true });
}

async function fetchPrFiles(
  installationId: number,
  repoFullName: string,
  prNumber: number,
): Promise<string[]> {
  const token = await getInstallationToken(installationId);
  const response = await fetch(
    `https://api.github.com/repos/${repoFullName}/pulls/${prNumber}/files?per_page=100`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!response.ok) return [];

  const files = (await response.json()) as Array<{ filename: string }>;
  return files.map((f) => f.filename);
}

async function checkInstallationUsage(
  adminClient: ReturnType<typeof createSupabaseAdmin>,
  inst: { user_id: string | null; scans_this_month: number; month_period: string },
): Promise<boolean> {
  // If linked to a user, check their plan
  if (inst.user_id) {
    const { data: sub } = await adminClient
      .from("subscriptions")
      .select("plan")
      .eq("user_id", inst.user_id)
      .eq("status", "active")
      .maybeSingle();

    if (sub?.plan === "pro") return true;
  }

  // Free tier: check installation-level monthly counter
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  if (inst.month_period !== currentMonth) {
    // New month -- reset counter (will be updated on increment)
    return true;
  }

  return inst.scans_this_month < FREE_SCANS_PER_MONTH;
}

async function incrementInstallationUsage(
  adminClient: ReturnType<typeof createSupabaseAdmin>,
  inst: { installation_id?: number; scans_this_month: number; month_period: string },
): Promise<void> {
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  const isNewMonth = inst.month_period !== currentMonth;

  await adminClient
    .from("github_installations")
    .update({
      scans_this_month: isNewMonth ? 1 : inst.scans_this_month + 1,
      month_period: currentMonth,
      updated_at: new Date().toISOString(),
    })
    .eq("installation_id", inst.installation_id);
}
