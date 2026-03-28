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
 * GET /api/teams/:teamId/projects
 * List team projects with latest scan info. Requires team membership.
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

  const { data, error } = await supabase
    .from("team_projects")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 },
    );
  }

  return NextResponse.json({ projects: data });
}

/**
 * POST /api/teams/:teamId/projects
 * Add a Supabase project to the team. Requires admin/member role.
 */
export async function POST(request: NextRequest, context: RouteContext) {
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
  ]);
  if (!isTeamMembership(roleResult)) {
    return roleResult;
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

  const { name, supabaseUrl } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Project name is required" },
      { status: 400 },
    );
  }

  if (typeof supabaseUrl !== "string" || supabaseUrl.trim().length === 0) {
    return NextResponse.json(
      { error: "Supabase URL is required" },
      { status: 400 },
    );
  }

  const normalizedUrl = supabaseUrl.trim().replace(/\/+$/, "");

  const { data: project, error } = await supabase
    .from("team_projects")
    .insert({
      team_id: teamId,
      name: name.trim(),
      supabase_url: normalizedUrl,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "This Supabase URL is already added to the team" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to add project" },
      { status: 500 },
    );
  }

  return NextResponse.json({ project }, { status: 201 });
}
