import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getPreferencesByToken,
  updatePreferencesByToken,
} from "@/lib/email/preferences";

/**
 * GET /api/email/unsubscribe?token=xxx
 * One-click unsubscribe: disables all transactional emails.
 *
 * GET /api/email/unsubscribe?token=xxx&type=scan_results_email
 * Selective unsubscribe: disables only the specified email type.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const type = request.nextUrl.searchParams.get("type");

  if (!token) {
    return new NextResponse(unsubscribeHtml("Missing token", false), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const adminClient = createSupabaseAdmin();
  const preferences = await getPreferencesByToken(adminClient, token);

  if (!preferences) {
    return new NextResponse(unsubscribeHtml("Invalid token", false), {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  }

  const validTypes = [
    "welcome_email",
    "scan_results_email",
    "weekly_digest_email",
  ] as const;

  if (type && validTypes.includes(type as (typeof validTypes)[number])) {
    // Selective unsubscribe
    await updatePreferencesByToken(adminClient, token, {
      [type]: false,
    });
  } else {
    // Unsubscribe from all
    await updatePreferencesByToken(adminClient, token, {
      welcome_email: false,
      scan_results_email: false,
      weekly_digest_email: false,
    });
  }

  return new NextResponse(
    unsubscribeHtml("You have been unsubscribed", true),
    {
      status: 200,
      headers: { "Content-Type": "text/html" },
    },
  );
}

function unsubscribeHtml(message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Unsubscribe - SupaScanner</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f6f6f6;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
    }
    .card {
      background: white;
      border-radius: 8px;
      padding: 48px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 20px; color: #1a1a1a; margin: 0 0 8px 0; }
    p { font-size: 14px; color: #666; margin: 0 0 24px 0; }
    a {
      display: inline-block;
      background: #1a1a1a;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? "&#10003;" : "&#10007;"}</div>
    <h1>${escapeHtml(message)}</h1>
    <p>${success ? "You will no longer receive these emails from SupaScanner." : "Please check the link and try again."}</p>
    <a href="https://supabase-scanner.vercel.app/dashboard">Go to Dashboard</a>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
