import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export type TeamRole = "admin" | "member" | "viewer";

export interface TeamMembership {
  readonly role: TeamRole;
  readonly teamId: string;
  readonly userId: string;
}

export async function getTeamMembership(
  supabase: SupabaseClient,
  teamId: string,
  userId: string,
): Promise<TeamMembership | null> {
  const { data, error } = await supabase
    .from("team_members")
    .select("role, team_id, user_id")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .not("accepted_at", "is", null)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    role: data.role as TeamRole,
    teamId: data.team_id,
    userId: data.user_id,
  };
}

export async function requireTeamRole(
  supabase: SupabaseClient,
  teamId: string,
  userId: string,
  minRoles: readonly TeamRole[],
): Promise<TeamMembership | NextResponse> {
  const membership = await getTeamMembership(supabase, teamId, userId);

  if (!membership) {
    return NextResponse.json(
      { error: "Not a member of this team" },
      { status: 403 },
    );
  }

  if (!minRoles.includes(membership.role)) {
    return NextResponse.json(
      { error: "Insufficient role for this action" },
      { status: 403 },
    );
  }

  return membership;
}

export function isTeamMembership(
  result: TeamMembership | NextResponse,
): result is TeamMembership {
  return "role" in result;
}
