import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  requireTeamRole,
  isTeamMembership,
} from "@/lib/teams/auth";

interface RouteContext {
  readonly params: Promise<{ teamId: string; memberId: string }>;
}

/**
 * PATCH /api/teams/:teamId/members/:memberId
 * Change a member's role. Cannot demote owner. Requires admin/owner.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { teamId, memberId } = await context.params;
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

  // Check if requester is admin or owner
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

  // Get the target member
  const { data: targetMember } = await supabase
    .from("team_members")
    .select("id, user_id, role")
    .eq("id", memberId)
    .eq("team_id", teamId)
    .single();

  if (!targetMember) {
    return NextResponse.json(
      { error: "Member not found" },
      { status: 404 },
    );
  }

  // Cannot change role of team owner
  const { data: team } = await supabase
    .from("teams")
    .select("owner_id")
    .eq("id", teamId)
    .single();

  if (team && targetMember.user_id === team.owner_id) {
    return NextResponse.json(
      { error: "Cannot change the role of the team owner" },
      { status: 403 },
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

  const { role } = body as Record<string, unknown>;
  const validRoles = ["admin", "member", "viewer"];

  if (typeof role !== "string" || !validRoles.includes(role)) {
    return NextResponse.json(
      { error: "Role must be one of: admin, member, viewer" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("team_members")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", memberId)
    .eq("team_id", teamId)
    .select("id, team_id, user_id, email, role, accepted_at, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 },
    );
  }

  return NextResponse.json({ member: data });
}

/**
 * DELETE /api/teams/:teamId/members/:memberId
 * Remove a member. Admin/owner can remove others. Members can self-remove.
 * Cannot remove the team owner.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { teamId, memberId } = await context.params;
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

  // Get the target member
  const { data: targetMember } = await supabase
    .from("team_members")
    .select("id, user_id")
    .eq("id", memberId)
    .eq("team_id", teamId)
    .single();

  if (!targetMember) {
    return NextResponse.json(
      { error: "Member not found" },
      { status: 404 },
    );
  }

  // Cannot remove the team owner
  const { data: team } = await supabase
    .from("teams")
    .select("owner_id")
    .eq("id", teamId)
    .single();

  if (team && targetMember.user_id === team.owner_id) {
    return NextResponse.json(
      { error: "Cannot remove the team owner" },
      { status: 403 },
    );
  }

  // Allow self-removal or admin/owner removal
  const isSelfRemoval = targetMember.user_id === user.id;
  if (!isSelfRemoval) {
    const roleResult = await requireTeamRole(supabase, teamId, user.id, [
      "admin",
    ]);
    if (!isTeamMembership(roleResult)) {
      if (!team || team.owner_id !== user.id) {
        return roleResult;
      }
    }
  }

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", memberId)
    .eq("team_id", teamId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 },
    );
  }

  return NextResponse.json({ deleted: true });
}
