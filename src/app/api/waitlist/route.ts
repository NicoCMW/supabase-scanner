import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();

    const VALID_SOURCES = ["landing_page", "security_checklist"] as const;
    const rawSource = typeof body.source === "string" ? body.source : "landing_page";
    const source = VALID_SOURCES.includes(rawSource as typeof VALID_SOURCES[number])
      ? rawSource
      : "landing_page";

    const { error } = await supabase
      .from("waitlist")
      .insert({ email, source });

    if (error) {
      // Unique constraint violation = duplicate email
      if (error.code === "23505") {
        return NextResponse.json({ success: true, message: "You're on the list!" });
      }
      console.error("Waitlist insert error:", error);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, message: "You're on the list!" });
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 },
    );
  }
}
