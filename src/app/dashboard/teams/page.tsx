import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { TeamCard } from "@/components/teams/team-card";
import type { Grade } from "@/types/scanner";

interface TeamRow {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly created_at: string;
}

interface MemberCountRow {
  readonly team_id: string;
}

interface ProjectRow {
  readonly team_id: string;
  readonly last_scan_grade: string | null;
}

export default async function TeamsListPage() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, slug, created_at")
    .order("created_at", { ascending: false });

  const teamList = (teams ?? []) as readonly TeamRow[];

  // Fetch member counts and project info for each team
  const teamIds = teamList.map((t) => t.id);

  const [{ data: members }, { data: projects }] = await Promise.all([
    supabase
      .from("team_members")
      .select("team_id")
      .in("team_id", teamIds)
      .not("accepted_at", "is", null),
    supabase
      .from("team_projects")
      .select("team_id, last_scan_grade")
      .in("team_id", teamIds),
  ]);

  const memberCounts = (members ?? []).reduce(
    (acc: Record<string, number>, m: MemberCountRow) => ({
      ...acc,
      [m.team_id]: (acc[m.team_id] ?? 0) + 1,
    }),
    {},
  );

  const projectsByTeam = (projects ?? []).reduce(
    (acc: Record<string, readonly ProjectRow[]>, p: ProjectRow) => ({
      ...acc,
      [p.team_id]: [...(acc[p.team_id] ?? []), p],
    }),
    {},
  );

  function aggregateGrade(
    teamProjects: readonly ProjectRow[],
  ): Grade | null {
    const GRADE_VALUES: Record<string, number> = {
      A: 4,
      B: 3,
      C: 2,
      D: 1,
      F: 0,
    };
    const GRADE_LETTERS = ["F", "D", "C", "B", "A"];
    const graded = teamProjects.filter((p) => p.last_scan_grade !== null);
    if (graded.length === 0) return null;
    const avg =
      graded.reduce(
        (sum, p) => sum + (GRADE_VALUES[p.last_scan_grade!] ?? 0),
        0,
      ) / graded.length;
    return (GRADE_LETTERS[Math.round(avg)] ?? "F") as Grade;
  }

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-sand-900">Teams</h1>
          <p className="text-sand-400 text-sm">
            Manage your team workspaces
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm text-sand-400 hover:text-sand-900 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/teams/new"
            className="px-4 py-2 bg-sand-900 hover:bg-sand-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Create Team
          </Link>
        </div>
      </header>

      {teamList.length === 0 ? (
        <div className="text-center py-16 border border-sand-200 rounded-lg bg-white">
          <p className="text-sand-400 mb-4">
            You don&apos;t belong to any teams yet.
          </p>
          <Link
            href="/dashboard/teams/new"
            className="px-4 py-2 bg-sand-900 hover:bg-sand-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Create your first team
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {teamList.map((team) => (
            <TeamCard
              key={team.id}
              id={team.id}
              name={team.name}
              slug={team.slug}
              memberCount={memberCounts[team.id] ?? 0}
              projectCount={(projectsByTeam[team.id] ?? []).length}
              aggregateGrade={aggregateGrade(projectsByTeam[team.id] ?? [])}
            />
          ))}
        </div>
      )}
    </main>
  );
}
