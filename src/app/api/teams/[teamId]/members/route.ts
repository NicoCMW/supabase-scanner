import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import crypto from "crypto";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { resend, EMAIL_FROM } from "@/lib/email/client";
import {
  requireTeamRole,
  isTeamMembership,
} from "@/lib/teams/auth";

interface RouteContext {
  readonly params: Promise<{ teamId: string }>;
}

/**
 * GET /api/teams/:teamId/members
 * List team members (including pending invites). Requires team membership.
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
    .from("team_members")
    .select("id, team_id, user_id, email, role, accepted_at, created_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 },
    );
  }

  return NextResponse.json({ members: data });
}

/**
 * POST /api/teams/:teamId/members
 * Invite a member by email. Requires admin/owner role.
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
  ]);
  // Also allow team owner
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { email, role } = body as Record<string, unknown>;

  if (typeof email !== "string" || email.trim().length === 0) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 },
    );
  }

  const validRoles = ["admin", "member", "viewer"];
  const memberRole = typeof role === "string" && validRoles.includes(role)
    ? role
    : "member";

  const inviteToken = crypto.randomBytes(32).toString("hex");
  const normalizedEmail = email.trim().toLowerCase();

  // Check if user already exists in auth.users (use admin client)
  const adminClient = createSupabaseAdmin();
  const { data: existingUsers } = await adminClient.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === normalizedEmail,
  );

  const { data: member, error: insertError } = await supabase
    .from("team_members")
    .insert({
      team_id: teamId,
      user_id: existingUser?.id ?? null,
      email: normalizedEmail,
      role: memberRole,
      invited_by: user.id,
      invite_token: inviteToken,
    })
    .select("id, team_id, user_id, email, role, accepted_at, created_at")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "This email has already been invited to the team" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to invite member" },
      { status: 500 },
    );
  }

  // Get team name for the email
  const { data: team } = await supabase
    .from("teams")
    .select("name")
    .eq("id", teamId)
    .single();

  // Send invite email (fire-and-forget)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://supascanner.com";
  const inviteUrl = `${siteUrl}/invite/${inviteToken}`;

  resend.emails
    .send({
      from: EMAIL_FROM,
      to: normalizedEmail,
      subject: `You've been invited to join ${team?.name ?? "a team"} on SupaScanner`,
      html: `
        <h2>Team Invitation</h2>
        <p>${user.email} has invited you to join <strong>${team?.name ?? "a team"}</strong> on SupaScanner as a ${memberRole}.</p>
        <p><a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Accept Invitation</a></p>
        <p>Or copy this link: ${inviteUrl}</p>
      `,
    })
    .catch((err) => {
      Sentry.captureException(err, {
        extra: { context: "team_invite_email", teamId, email: normalizedEmail },
      });
    });

  return NextResponse.json({ member }, { status: 201 });
}
