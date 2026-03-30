import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

const MAX_WEBHOOKS_PER_USER = 10;

/**
 * GET /api/webhooks
 * List all webhooks for the authenticated user.
 */
export async function GET() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("webhooks")
    .select("id, project_id, label, enabled, notify_scan_complete, notify_critical_finding, notify_score_degradation, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 });
  }

  return NextResponse.json({ webhooks: data });
}

/**
 * POST /api/webhooks
 * Create a new webhook configuration. Auto-generates HMAC secret.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { url, label, projectId } = body as Record<string, unknown>;

  if (typeof url !== "string" || !url.startsWith("https://")) {
    return NextResponse.json(
      { error: "Webhook URL must be a valid HTTPS URL." },
      { status: 422 },
    );
  }

  // Check webhook limit
  const { count } = await supabase
    .from("webhooks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= MAX_WEBHOOKS_PER_USER) {
    return NextResponse.json(
      { error: `Maximum ${MAX_WEBHOOKS_PER_USER} webhooks per user` },
      { status: 422 },
    );
  }

  const secret = randomBytes(32).toString("hex");

  const { data, error } = await supabase
    .from("webhooks")
    .insert({
      user_id: user.id,
      url,
      label: typeof label === "string" && label.trim() ? label.trim() : "My Webhook",
      project_id: typeof projectId === "string" ? projectId : null,
      secret,
    })
    .select("id, project_id, label, secret, enabled, notify_scan_complete, notify_critical_finding, notify_score_degradation, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A webhook with this URL already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 });
  }

  return NextResponse.json({ webhook: data }, { status: 201 });
}
