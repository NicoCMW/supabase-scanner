import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  requireTeamRole,
  isTeamMembership,
} from "@/lib/teams/auth";

interface RouteContext {
  readonly params: Promise<{ teamId: string }>;
}

const GRADE_VALUES: Record<string, number> = {
  A: 4,
  B: 3,
  C: 2,
  D: 1,
  F: 0,
};
const GRADE_LETTERS = ["F", "D", "C", "B", "A"];

/**
 * GET /api/teams/:teamId/dashboard
 * Returns aggregate posture score, per-project breakdown, and total findings.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { teamId } = await context.params;
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
    "viewer",
  ]);
  if (!isTeamMembership(roleResult)) {
    return roleResult;
  }

  // Fetch all team projects
  const { data: projects, error: projectsError } = await supabase
    .from("team_projects")
    .select("id, name, supabase_url, last_scan_grade, last_scan_at, last_scan_job_id")
    .eq("team_id", teamId)
    .order("name", { ascending: true });

  if (projectsError) {
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 },
    );
  }

  // For each project with a last scan, get finding counts by severity
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

  // Compute aggregate posture score
  const gradedProjects = projectBreakdown.filter((p) => p.grade !== null);
  let aggregateGrade: string | null = null;
  let aggregateScore: number | null = null;

  if (gradedProjects.length > 0) {
    aggregateScore =
      gradedProjects.reduce(
        (sum, p) => sum + (GRADE_VALUES[p.grade!] ?? 0),
        0,
      ) / gradedProjects.length;
    aggregateGrade = GRADE_LETTERS[Math.round(aggregateScore)] ?? "F";
  }

  // Total critical and high findings across all projects
  const totalCritical = projectBreakdown.reduce(
    (sum, p) => sum + p.findings.critical,
    0,
  );
  const totalHigh = projectBreakdown.reduce(
    (sum, p) => sum + p.findings.high,
    0,
  );

  return NextResponse.json({
    aggregateGrade,
    aggregateScore,
    totalProjects: projectBreakdown.length,
    gradedProjects: gradedProjects.length,
    totalCriticalFindings: totalCritical,
    totalHighFindings: totalHigh,
    projects: projectBreakdown,
  });
}
