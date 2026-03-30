import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { sendWebhookTestMessage } from "@/lib/webhooks/notifications";

/**
 * POST /api/webhooks/:id/test
 * Send a test payload to verify webhook connectivity.
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
    .from("webhooks")
    .select("url, secret")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !webhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  const success = await sendWebhookTestMessage(webhook.url, webhook.secret);

  if (!success) {
    return NextResponse.json(
      { error: "Failed to deliver test payload. Check that the URL is reachable and returns a 2xx response." },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
}
