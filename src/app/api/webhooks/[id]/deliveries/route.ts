import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * GET /api/webhooks/:id/deliveries
 * List recent delivery logs for a webhook.
 */
export async function GET(
  request: NextRequest,
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

  // Verify the webhook belongs to the user
  const { data: webhook, error: webhookError } = await supabase
    .from("webhooks")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (webhookError || !webhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("limit")) || 20,
    100,
  );

  const { data, error } = await supabase
    .from("webhook_delivery_logs")
    .select("id, event_type, response_status, success, attempt, error_message, created_at")
    .eq("webhook_id", id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch delivery logs" }, { status: 500 });
  }

  return NextResponse.json({ deliveries: data });
}
