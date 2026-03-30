import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseServiceRole } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/billing/usage";

interface FeedbackBody {
  readonly scanJobId?: string;
  readonly responseType: "nps" | "feedback";
  readonly npsScore?: number;
  readonly comment?: string;
  readonly testimonialConsent?: boolean;
  readonly scanGrade?: string;
  readonly findingCount?: number;
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as FeedbackBody;

  if (!body.responseType || !["nps", "feedback"].includes(body.responseType)) {
    return NextResponse.json(
      { error: "responseType must be 'nps' or 'feedback'" },
      { status: 400 },
    );
  }

  if (
    body.responseType === "nps" &&
    (body.npsScore == null || body.npsScore < 0 || body.npsScore > 10)
  ) {
    return NextResponse.json(
      { error: "npsScore must be between 0 and 10" },
      { status: 400 },
    );
  }

  const planId = await getUserPlan(supabase, user.id);

  const { data, error } = await supabase
    .from("feedback_responses")
    .insert({
      user_id: user.id,
      scan_job_id: body.scanJobId ?? null,
      response_type: body.responseType,
      nps_score: body.npsScore ?? null,
      comment: body.comment ?? null,
      testimonial_consent: body.testimonialConsent ?? false,
      scan_grade: body.scanGrade ?? null,
      finding_count: body.findingCount ?? null,
      user_plan: planId,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: data.id });
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const exportAll = searchParams.get("export") === "true";

  if (exportAll) {
    // Admin export uses service role to bypass RLS
    const serviceClient = await createSupabaseServiceRole();
    const { data, error } = await serviceClient
      .from("feedback_responses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch feedback" },
        { status: 500 },
      );
    }

    return NextResponse.json({ responses: data });
  }

  // Check if user has submitted NPS for current session
  const { data: existing } = await supabase
    .from("feedback_responses")
    .select("id")
    .eq("response_type", "nps")
    .limit(1);

  return NextResponse.json({
    hasSubmittedNps: (existing?.length ?? 0) > 0,
  });
}
