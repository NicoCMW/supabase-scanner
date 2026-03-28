import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  requireTeamRole,
  isTeamMembership,
} from "@/lib/teams/auth";

interface RouteContext {
  readonly params: Promise<{ teamId: string; projectId: string }>;
}

/**
 * DELETE /api/teams/:teamId/projects/:projectId
 * Remove a project from the team. Requires admin/owner role.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
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

  // Check admin role or team owner
  const roleResult = await requireTeamRole(supabase, teamId, user.id, [
    "admin",
  ]);
  if (!isTeamMembership(roleResult)) {
    const { data: team } = await supabase
      .from("teams")
      .select("owner_id")
      .eq("id", teamId)
      .single();

    if (!team || team.owner_id !== user.id) {
      return roleResult;
    }
  }

  const { error } = await supabase
    .from("team_projects")
    .delete()
    .eq("id", projectId)
    .eq("team_id", teamId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to remove project" },
      { status: 500 },
    );
  }

  return NextResponse.json({ deleted: true });
}
