import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getTeamMembership } from "@/lib/teams/auth";
import { TeamNav } from "@/components/teams/team-nav";
import { PostureScore } from "@/components/teams/posture-score";
import { GradeDistribution } from "@/components/teams/grade-distribution";
import { ProjectCard } from "@/components/teams/project-card";
import type { Grade } from "@/types/scanner";

interface PageProps {
  readonly params: Promise<{ teamId: string }>;
}

export default async function TeamDashboardPage({ params }: PageProps) {
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

  const { data: team } = await supabase
    .from("teams")
    .select("id, name, slug")
    .eq("id", teamId)
    .single();

  if (!team) {
    notFound();
  }

  const { data: projects } = await supabase
    .from("team_projects")
    .select(
      "id, name, supabase_url, last_scan_grade, last_scan_at, last_scan_job_id",
    )
    .eq("team_id", teamId)
    .order("name", { ascending: true });

  const GRADE_VALUES: Record<string, number> = {
    A: 4,
    B: 3,
    C: 2,
    D: 1,
    F: 0,
  };
  const GRADE_LETTERS = ["F", "D", "C", "B", "A"];

  const projectBreakdown = await Promise.all(
    (projects ?? []).map(async (project) => {
      let findingCounts = { critical: 0, high: 0, medium: 0, low: 0 };

      if (project.last_scan_job_id) {
        const { data: findings } = await supabase
          .from("findings")
          .select("severity")
          .eq("scan_job_id", project.last_scan_job_id);

        if (findings) {
          findingCounts = findings.reduce(
            (acc, f) => {
              const severity = f.severity as keyof typeof findingCounts;
              if (severity in acc) {
                return { ...acc, [severity]: acc[severity] + 1 };
              }
              return acc;
            },
            { critical: 0, high: 0, medium: 0, low: 0 },
          );
        }
      }

      return {
        id: project.id,
        name: project.name,
        supabaseUrl: project.supabase_url,
        grade: project.last_scan_grade,
        lastScanAt: project.last_scan_at,
        findings: findingCounts,
      };
    }),
  );

  const gradedProjects = projectBreakdown.filter((p) => p.grade !== null);
  let aggregateGrade: string | null = null;

  if (gradedProjects.length > 0) {
    const avgScore =
      gradedProjects.reduce(
        (sum, p) => sum + (GRADE_VALUES[p.grade!] ?? 0),
        0,
      ) / gradedProjects.length;
    aggregateGrade = GRADE_LETTERS[Math.round(avgScore)] ?? "F";
  }

  const totalCritical = projectBreakdown.reduce(
    (sum, p) => sum + p.findings.critical,
    0,
  );
  const totalHigh = projectBreakdown.reduce(
    (sum, p) => sum + p.findings.high,
    0,
  );

  const canScan =
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
        <PostureScore
          grade={aggregateGrade as Grade | null}
          totalProjects={projectBreakdown.length}
          gradedProjects={gradedProjects.length}
          totalCritical={totalCritical}
          totalHigh={totalHigh}
        />

        <GradeDistribution projects={projectBreakdown} />

        {projectBreakdown.length > 0 ? (
          <div>
            <h2 className="text-base font-semibold text-sand-900 mb-3">
              Projects
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {projectBreakdown.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  teamId={teamId}
                  name={project.name}
                  supabaseUrl={project.supabaseUrl}
                  grade={project.grade}
                  lastScanAt={project.lastScanAt}
                  findings={project.findings}
                  canScan={canScan}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 border border-sand-200 rounded-lg bg-white">
            <p className="text-sand-400 mb-4">
              No projects added yet.
            </p>
            {canScan && (
              <Link
                href={`/dashboard/teams/${teamId}/projects`}
                className="px-4 py-2 bg-sand-900 hover:bg-sand-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Add a project
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
