import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/billing/usage";
import { isProPlan } from "@/lib/billing/plans";
import { ScanHistory } from "@/components/scan-history";
import { UsageBanner } from "@/components/usage-banner";
import { AnalyticsEvents } from "@/components/analytics-events";
import { TrendChart } from "@/components/trend-chart";
import { ExportButton } from "@/components/export-button";
import { DashboardStats } from "@/components/dashboard-stats";
import { ScheduleManager } from "@/components/schedule-manager";
import { ComparisonSummary } from "@/components/comparison-summary";
import { WelcomeBanner } from "@/components/welcome-banner";
import { EmptyDashboard } from "@/components/empty-dashboard";
import type { Grade } from "@/types/scanner";

interface ScanJobRow {
  readonly id: string;
  readonly supabase_url: string;
  readonly status: string;
  readonly grade: Grade | null;
  readonly total_findings: number;
  readonly duration_ms: number | null;
  readonly created_at: string;
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: scanJobs }, planId] = await Promise.all([
    supabase
      .from("scan_jobs")
      .select(
        "id, supabase_url, status, grade, total_findings, duration_ms, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(50),
    getUserPlan(supabase, user.id),
  ]);

  const isPro = isProPlan(planId);
  const jobs = (scanJobs ?? []) as readonly ScanJobRow[];

  const completedScans = jobs.filter(
    (j) => j.status === "completed" && j.grade != null,
  );

  // Find the latest scan pair for the same URL to show comparison summary
  const latestPair = (() => {
    if (completedScans.length < 2) return null;
    const latest = completedScans[0];
    const previous = completedScans.find(
      (j) =>
        j.id !== latest.id && j.supabase_url === latest.supabase_url,
    );
    if (!previous || !latest.grade || !previous.grade) return null;
    return {
      fromId: previous.id,
      fromGrade: previous.grade as Grade,
      fromFindings: previous.total_findings,
      fromDate: previous.created_at,
      toId: latest.id,
      toGrade: latest.grade as Grade,
      toFindings: latest.total_findings,
      toDate: latest.created_at,
      url: latest.supabase_url,
    };
  })();

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-sand-900">Dashboard</h1>
          <p className="text-sand-400 text-sm">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/dashboard/integrations"
            className="text-sm text-sand-400 hover:text-sand-900 transition-colors"
          >
            Integrations
          </a>
          <a
            href="/dashboard/referrals"
            className="text-sm text-sand-400 hover:text-sand-900 transition-colors"
          >
            Referrals
          </a>
          <a
            href="/dashboard/teams"
            className="text-sm text-sand-400 hover:text-sand-900 transition-colors"
          >
            Teams
          </a>
          <a
            href="/dashboard/widget"
            className="text-sm text-sand-400 hover:text-sand-900 transition-colors"
          >
            Get Widget
          </a>
          <ExportButton />
          <a
            href="/scan"
            className="px-4 py-2 bg-sand-900 hover:bg-sand-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            New scan
          </a>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-sand-400 hover:text-sand-900 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <Suspense>
        <AnalyticsEvents />
      </Suspense>

      <Suspense>
        <WelcomeBanner />
      </Suspense>

      {jobs.length === 0 ? (
        <EmptyDashboard />
      ) : (
        <>
          <UsageBanner />

          {completedScans.length > 0 && (
            <div className="mb-6">
              <DashboardStats scanJobs={completedScans as readonly (ScanJobRow & { grade: Grade })[]} />
            </div>
          )}

          {completedScans.length >= 2 && (
            <div className="mb-6">
              <TrendChart
                scans={completedScans.map((j) => ({
                  grade: j.grade!,
                  created_at: j.created_at,
                }))}
              />
            </div>
          )}

          {latestPair && (
            <div className="mb-6">
              <ComparisonSummary pair={latestPair} />
            </div>
          )}

          {isPro && (
            <div className="mb-6">
              <ScheduleManager />
            </div>
          )}

          <ScanHistory scanJobs={jobs} />
        </>
      )}
    </main>
  );
}
