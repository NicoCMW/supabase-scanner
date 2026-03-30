import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { SlackWebhook } from "@/lib/slack/types";

const SLACK_WEBHOOK_URL_PATTERN =
  /^https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+$/;

const MAX_WEBHOOKS_PER_USER = 10;

/**
 * GET /api/slack/webhooks
 * List all Slack webhooks for the authenticated user.
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
    .from("slack_webhooks")
    .select("id, label, channel_name, enabled, notify_scan_complete, notify_critical_finding, notify_score_degradation, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 });
  }

  return NextResponse.json({ webhooks: data });
}

/**
 * POST /api/slack/webhooks
 * Create a new Slack webhook configuration.
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

  const { webhookUrl, label, channelName } = body as Record<string, unknown>;

  if (typeof webhookUrl !== "string" || !SLACK_WEBHOOK_URL_PATTERN.test(webhookUrl)) {
    return NextResponse.json(
      { error: "Invalid Slack webhook URL. Must be a valid https://hooks.slack.com/services/... URL." },
      { status: 422 },
    );
  }

  // Check webhook limit
  const { count } = await supabase
    .from("slack_webhooks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= MAX_WEBHOOKS_PER_USER) {
    return NextResponse.json(
      { error: `Maximum ${MAX_WEBHOOKS_PER_USER} webhooks per user` },
      { status: 422 },
    );
  }

  const { data, error } = await supabase
    .from("slack_webhooks")
    .insert({
      user_id: user.id,
      webhook_url: webhookUrl,
      label: typeof label === "string" && label.trim() ? label.trim() : "My Slack Channel",
      channel_name: typeof channelName === "string" && channelName.trim() ? channelName.trim() : null,
    })
    .select("id, label, channel_name, enabled, notify_scan_complete, notify_critical_finding, notify_score_degradation, created_at, updated_at")
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
