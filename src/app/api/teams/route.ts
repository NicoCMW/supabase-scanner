import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

/**
 * GET /api/teams
 * List teams for the authenticated user.
 */
export async function GET() {
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

  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 },
    );
  }

  return NextResponse.json({ teams: data });
}

/**
 * POST /api/teams
 * Create a new team. Creator is auto-added as admin member.
 */
export async function POST(request: NextRequest) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { name } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Team name is required" },
      { status: 400 },
    );
  }

  const slug = generateSlug(name);
  if (slug.length === 0) {
    return NextResponse.json(
      { error: "Team name must contain at least one alphanumeric character" },
      { status: 400 },
    );
  }

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      name: name.trim(),
      slug,
      owner_id: user.id,
    })
    .select("*")
    .single();

  if (teamError) {
    if (teamError.code === "23505") {
      return NextResponse.json(
        { error: "A team with this name already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 },
    );
  }

  // Add creator as admin member with accepted status
  const { error: memberError } = await supabase
    .from("team_members")
    .insert({
      team_id: team.id,
      user_id: user.id,
      email: user.email ?? "",
      role: "admin",
      invited_by: user.id,
      accepted_at: new Date().toISOString(),
    });

  if (memberError) {
    // Rollback team creation
    await supabase.from("teams").delete().eq("id", team.id);
    return NextResponse.json(
      { error: "Failed to create team membership" },
      { status: 500 },
    );
  }

  return NextResponse.json({ team }, { status: 201 });
}
