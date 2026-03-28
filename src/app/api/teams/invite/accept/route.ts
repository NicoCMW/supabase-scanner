import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/teams/invite/accept
 * Accept a team invitation. Body: { token }
 * Validates token, sets user_id and accepted_at, clears invite_token.
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

  const { token } = body as Record<string, unknown>;

  if (typeof token !== "string" || token.trim().length === 0) {
    return NextResponse.json(
      { error: "Invite token is required" },
      { status: 400 },
    );
  }

  // Use admin client to find and update the invite (bypasses RLS for
  // the case where the user is not yet a team member)
  const adminClient = createSupabaseAdmin();

  const { data: invite, error: findError } = await adminClient
    .from("team_members")
    .select("id, team_id, email, accepted_at")
    .eq("invite_token", token.trim())
    .single();

  if (findError || !invite) {
    return NextResponse.json(
      { error: "Invalid or expired invite token" },
      { status: 404 },
    );
  }

  if (invite.accepted_at) {
    return NextResponse.json(
      { error: "This invitation has already been accepted" },
      { status: 400 },
    );
  }

  const { data: member, error: updateError } = await adminClient
    .from("team_members")
    .update({
      user_id: user.id,
      accepted_at: new Date().toISOString(),
      invite_token: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invite.id)
    .select("id, team_id, user_id, email, role, accepted_at")
    .single();

  if (updateError || !member) {
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 },
    );
  }

  // Fetch team details for the response
  const { data: team } = await adminClient
    .from("teams")
    .select("id, name, slug")
    .eq("id", invite.team_id)
    .single();

  return NextResponse.json({ member, team });
}
