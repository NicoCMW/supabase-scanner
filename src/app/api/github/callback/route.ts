import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * GitHub App installation callback.
 * After a user installs the app, GitHub redirects here with installation_id.
 * We link the installation to the authenticated SupaScanner user.
 */
export async function GET(request: NextRequest) {
  const installationId = request.nextUrl.searchParams.get("installation_id");
  const setupAction = request.nextUrl.searchParams.get("setup_action");

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://supabase-scanner.vercel.app";

  if (!installationId) {
    return NextResponse.redirect(
      `${siteUrl}/dashboard?error=missing_installation`,
    );
  }

  // Get the authenticated user
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login, then back to callback
    const callbackUrl = request.nextUrl.toString();
    return NextResponse.redirect(
      `${siteUrl}/login?redirect=${encodeURIComponent(callbackUrl)}`,
    );
  }

  const adminClient = createSupabaseAdmin();

  if (setupAction === "install" || setupAction === "update") {
    // Link the installation to this user
    await adminClient
      .from("github_installations")
      .update({
        user_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("installation_id", Number(installationId));
  }

  return NextResponse.redirect(
    `${siteUrl}/dashboard/github?installation=${installationId}&linked=true`,
  );
}
