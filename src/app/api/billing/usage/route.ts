import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getUsageStatus } from "@/lib/billing/usage";

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

  const usage = await getUsageStatus(supabase, user.id);
  return NextResponse.json(usage);
}
