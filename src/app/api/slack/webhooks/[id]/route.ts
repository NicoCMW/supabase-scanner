import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * PATCH /api/slack/webhooks/:id
 * Update a Slack webhook configuration.
 */
export async function PATCH(
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates = body as Record<string, unknown>;
  const allowedFields = [
    "label",
    "channel_name",
    "enabled",
    "notify_scan_complete",
    "notify_critical_finding",
    "notify_score_degradation",
  ] as const;

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  for (const field of allowedFields) {
    if (field in updates) {
      patch[field] = updates[field];
    }
  }

  const { data, error } = await supabase
    .from("slack_webhooks")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, label, channel_name, enabled, notify_scan_complete, notify_critical_finding, notify_score_degradation, created_at, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  return NextResponse.json({ webhook: data });
}

/**
 * DELETE /api/slack/webhooks/:id
 * Delete a Slack webhook configuration.
 */
export async function DELETE(
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

  const { error } = await supabase
    .from("slack_webhooks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete webhook" }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
