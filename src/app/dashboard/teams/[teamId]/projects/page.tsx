import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getTeamMembership } from "@/lib/teams/auth";
import { TeamNav } from "@/components/teams/team-nav";
import { AddProjectForm } from "@/components/teams/add-project-form";
import { GradeBadge } from "@/components/grade-badge";
import type { Grade } from "@/types/scanner";

interface PageProps {
  readonly params: Promise<{ teamId: string }>;
}

interface ProjectRow {
  readonly id: string;
  readonly name: string;
  readonly supabase_url: string;
  readonly last_scan_grade: string | null;
  readonly last_scan_at: string | null;
  readonly last_scan_job_id: string | null;
  readonly created_at: string;
}

interface FindingRow {
  readonly severity: string;
  readonly scan_job_id: string;
}

export default async function TeamProjectsPage({ params }: PageProps) {
  const { teamId } = await params;
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await getTeamMembership(supabase, teamId, user.id);
  if (!membership) {
    notFound();
  }

  const [{ data: team }, { data: projects }] = await Promise.all([
    supabase.from("teams").select("id, name, slug").eq("id", teamId).single(),
    supabase
      .from("team_projects")
      .select(
        "id, name, supabase_url, last_scan_grade, last_scan_at, last_scan_job_id, created_at",
      )
      .eq("team_id", teamId)
      .order("created_at", { ascending: false }),
  ]);

  if (!team) {
    notFound();
  }

  const projectList = (projects ?? []) as readonly ProjectRow[];

  // Fetch findings for projects with scans
  const scanJobIds = projectList
    .filter((p) => p.last_scan_job_id !== null)
    .map((p) => p.last_scan_job_id!);

  let findingsByJob: Record<
    string,
    { critical: number; high: number; medium: number; low: number }
  > = {};

  if (scanJobIds.length > 0) {
    const { data: findings } = await supabase
      .from("findings")
      .select("severity, scan_job_id")
      .in("scan_job_id", scanJobIds);

    findingsByJob = ((findings ?? []) as readonly FindingRow[]).reduce(
      (acc, f) => {
        const existing = acc[f.scan_job_id] ?? {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        };
        const severity = f.severity as keyof typeof existing;
        return {
          ...acc,
          [f.scan_job_id]: {
            ...existing,
            [severity]: (existing[severity] ?? 0) + 1,
          },
        };
      },
      {} as typeof findingsByJob,
    );
  }

  const canManage =
    membership.role === "admin" || membership.role === "member";

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/dashboard/teams"
            className="text-sm text-sand-400 hover:text-sand-900 transition-colors"
          >
            &larr; Teams
          </Link>
          <h1 className="text-xl font-semibold text-sand-900 mt-1">
            {team.name}
          </h1>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-sand-400 hover:text-sand-900 transition-colors"
        >
          Dashboard
        </Link>
      </header>

      <TeamNav teamId={teamId} />

      <div className="space-y-6">
        {canManage && (
          <div className="p-4 bg-white border border-sand-200 rounded-lg">
            <AddProjectForm teamId={teamId} />
          </div>
        )}

        {projectList.length === 0 ? (
          <div className="text-center py-12 border border-sand-200 rounded-lg bg-white">
            <p className="text-sand-400">No projects added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projectList.map((project) => {
              const findings = project.last_scan_job_id
                ? findingsByJob[project.last_scan_job_id] ?? {
                    critical: 0,
                    high: 0,
                    medium: 0,
                    low: 0,
                  }
                : null;

              return (
                <div
                  key={project.id}
                  className="p-4 bg-white border border-sand-200 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-sand-900">
                        {project.name}
                      </h3>
                      <p
                        className="text-xs text-sand-400 truncate mt-0.5"
                        title={project.supabase_url}
                      >
                        {project.supabase_url}
                      </p>
                    </div>
                    {project.last_scan_grade && (
                      <GradeBadge
                        grade={project.last_scan_grade as Grade}
                        size="sm"
                      />
                    )}
                  </div>

                  {project.last_scan_at && (
                    <p className="text-xs text-sand-400 mt-2">
                      Last scan:{" "}
                      {new Date(project.last_scan_at).toLocaleDateString()}
                    </p>
                  )}

                  {findings && (
                    <div className="flex gap-3 mt-2 text-xs">
                      {findings.critical > 0 && (
                        <span className="text-red-600 font-medium">
                          {findings.critical} critical
                        </span>
                      )}
                      {findings.high > 0 && (
                        <span className="text-orange-600 font-medium">
                          {findings.high} high
                        </span>
                      )}
                      {findings.medium > 0 && (
                        <span className="text-amber-600">
                          {findings.medium} medium
                        </span>
                      )}
                      {findings.low > 0 && (
                        <span className="text-blue-600">
                          {findings.low} low
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
