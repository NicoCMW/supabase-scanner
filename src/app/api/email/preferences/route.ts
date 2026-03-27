import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getOrCreatePreferences,
  updatePreferences,
} from "@/lib/email/preferences";

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

  const adminClient = createSupabaseAdmin();
  const preferences = await getOrCreatePreferences(adminClient, user.id);

  return NextResponse.json({
    welcome_email: preferences.welcome_email,
    scan_results_email: preferences.scan_results_email,
    weekly_digest_email: preferences.weekly_digest_email,
  });
}

export async function PATCH(request: NextRequest) {
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
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { welcome_email, scan_results_email, weekly_digest_email } =
    body as Record<string, unknown>;

  const updates: Record<string, boolean> = {};
  if (typeof welcome_email === "boolean") updates.welcome_email = welcome_email;
  if (typeof scan_results_email === "boolean")
    updates.scan_results_email = scan_results_email;
  if (typeof weekly_digest_email === "boolean")
    updates.weekly_digest_email = weekly_digest_email;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid preference fields provided" },
      { status: 400 },
    );
  }

  // Ensure preferences exist before updating
  const adminClient = createSupabaseAdmin();
  await getOrCreatePreferences(adminClient, user.id);

  const updated = await updatePreferences(supabase, user.id, updates);

  if (!updated) {
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    welcome_email: updated.welcome_email,
    scan_results_email: updated.scan_results_email,
    weekly_digest_email: updated.weekly_digest_email,
  });
}
