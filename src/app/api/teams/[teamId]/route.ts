import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  requireTeamRole,
  isTeamMembership,
} from "@/lib/teams/auth";

interface RouteContext {
  readonly params: Promise<{ teamId: string }>;
}

/**
 * GET /api/teams/:teamId
 * Get team details with member count, project count, and aggregate grade.
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

  const result = await requireTeamRole(supabase, teamId, user.id, [
    "admin",
    "member",
    "viewer",
  ]);
  if (!isTeamMembership(result)) {
    return result;
  }

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    return NextResponse.json(
      { error: "Team not found" },
      { status: 404 },
    );
  }

  const { count: memberCount } = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId)
    .not("accepted_at", "is", null);

  const { data: projects } = await supabase
    .from("team_projects")
    .select("last_scan_grade")
    .eq("team_id", teamId);

  const projectCount = projects?.length ?? 0;

  // Compute aggregate grade from project grades
  const gradeValues: Record<string, number> = {
    A: 4,
    B: 3,
    C: 2,
    D: 1,
    F: 0,
  };
  const gradeLetters = ["F", "D", "C", "B", "A"];
  const gradedProjects = (projects ?? []).filter(
    (p) => p.last_scan_grade !== null,
  );
  let aggregateGrade: string | null = null;
  if (gradedProjects.length > 0) {
    const avg =
      gradedProjects.reduce(
        (sum, p) => sum + (gradeValues[p.last_scan_grade] ?? 0),
        0,
      ) / gradedProjects.length;
    aggregateGrade = gradeLetters[Math.round(avg)] ?? "F";
  }

  return NextResponse.json({
    team: {
      ...team,
      memberCount: memberCount ?? 0,
      projectCount,
      aggregateGrade,
    },
  });
}

/**
 * PATCH /api/teams/:teamId
 * Update team name/slug. Requires admin or owner role.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
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
  ]);
  if (!isTeamMembership(roleResult)) {
    // Also allow if user is the team owner
    const { data: team } = await supabase
      .from("teams")
      .select("owner_id")
      .eq("id", teamId)
      .single();

    if (!team || team.owner_id !== user.id) {
      return roleResult;
    }
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

  const updates = body as Record<string, unknown>;
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof updates.name === "string" && updates.name.trim().length > 0) {
    patch.name = updates.name.trim();
  }

  if (typeof updates.slug === "string" && updates.slug.trim().length > 0) {
    patch.slug = updates.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 60);
  }

  const { data, error } = await supabase
    .from("teams")
    .update(patch)
    .eq("id", teamId)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A team with this slug already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 },
    );
  }

  return NextResponse.json({ team: data });
}

/**
 * DELETE /api/teams/:teamId
 * Delete team. Owner only.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
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

  const { data: team } = await supabase
    .from("teams")
    .select("owner_id")
    .eq("id", teamId)
    .single();

  if (!team) {
    return NextResponse.json(
      { error: "Team not found" },
      { status: 404 },
    );
  }

  if (team.owner_id !== user.id) {
    return NextResponse.json(
      { error: "Only the team owner can delete the team" },
      { status: 403 },
    );
  }

  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 },
    );
  }

  return NextResponse.json({ deleted: true });
}
