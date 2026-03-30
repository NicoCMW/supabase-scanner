import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { sendSlackTestMessage } from "@/lib/slack/notifications";

/**
 * POST /api/slack/webhooks/:id/test
 * Send a test message to the configured Slack webhook.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: webhook, error } = await supabase
    .from("slack_webhooks")
    .select("webhook_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !webhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  const success = await sendSlackTestMessage(webhook.webhook_url);

  if (!success) {
    return NextResponse.json(
      { error: "Failed to send test message. Check that the webhook URL is valid and the Slack app is installed." },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
}
