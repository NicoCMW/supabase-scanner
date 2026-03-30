import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getOrCreatePreferences, buildUnsubscribeUrl } from "@/lib/email/preferences";
import { sendWelcomeEmail } from "@/lib/email/send";
import { resolveReferralCode, recordReferralSignup } from "@/lib/referral";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createSupabaseServer();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const isNewUser = data.user?.created_at === data.user?.updated_at;
      const adminClient = createSupabaseAdmin();

      // Send welcome email for new users (fire-and-forget)
      if (isNewUser && data.user?.email) {
        getOrCreatePreferences(adminClient, data.user.id)
          .then((prefs) => {
            if (!prefs.welcome_email) return;
            return sendWelcomeEmail(data.user!.email!, {
              userName: data.user!.email!.split("@")[0],
              unsubscribeUrl: buildUnsubscribeUrl(prefs.unsubscribe_token),
            });
          })
          .catch((err) => {
            Sentry.captureException(err, {
              extra: { context: "welcome_email", userId: data.user?.id },
            });
          });

        // Track referral attribution from cookie (fire-and-forget)
        const refCode = request.cookies.get("ref")?.value;
        if (refCode) {
          resolveReferralCode(adminClient, refCode)
            .then((referralCode) => {
              if (!referralCode) return;
              return recordReferralSignup(
                adminClient,
                referralCode,
                data.user!.id,
              );
            })
            .catch((err) => {
              Sentry.captureException(err, {
                extra: { context: "referral_tracking", userId: data.user?.id },
              });
            });
        }
      }

      const separator = next.includes("?") ? "&" : "?";
      const redirectUrl = isNewUser
        ? `${origin}${next}${separator}signup=true`
        : `${origin}${next}`;

      const response = NextResponse.redirect(redirectUrl);
      // Clear the referral cookie after attribution
      if (isNewUser && request.cookies.get("ref")) {
        response.cookies.set("ref", "", { path: "/", maxAge: 0 });
      }
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
