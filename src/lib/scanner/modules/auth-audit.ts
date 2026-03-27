import type { Finding, ScanModule, ScanModuleResult, ScanTarget } from "@/types/scanner";
import { supabasePost } from "../supabase-client";
import { createFinding } from "../utils";

/**
 * Check if email signup is possible without email confirmation.
 * We attempt a signup with a clearly-test email and inspect the response.
 */
async function checkEmailConfirmation(
  target: ScanTarget,
): Promise<Finding | null> {
  const testEmail = `scanner-test-${Date.now()}@supabase-scanner-invalid.test`;
  const testPassword = "TestPassword123!@#_scanner_probe";

  const response = await supabasePost(target, "/auth/v1/signup", {
    email: testEmail,
    password: testPassword,
  });

  if (response.status === 200 && response.data) {
    const data = response.data as Record<string, unknown>;
    const user = data.user as Record<string, unknown> | undefined;

    // If user is returned with a confirmed_at or session is present,
    // email confirmation is disabled
    if (user) {
      const confirmedAt = user.confirmed_at || user.email_confirmed_at;
      const session = data.session;

      if (confirmedAt || session) {
        return createFinding({
          title: "Email confirmation is disabled",
          description:
            "New user signups are immediately confirmed without email verification. This allows attackers to create accounts with any email address, enabling abuse such as spam, impersonation, or resource exhaustion.",
          severity: "high",
          category: "auth",
          resource: "auth/config",
          details: {
            emailConfirmed: !!confirmedAt,
            sessionReturned: !!session,
          },
          remediation:
            "Enable email confirmation in Supabase Dashboard: Authentication > Settings > Enable email confirmations.",
        });
      }
    }
  }

  return null;
}

/**
 * Check for user enumeration via the signup endpoint.
 * If signing up with an existing email returns a different response than a new email,
 * attackers can enumerate valid email addresses.
 */
async function checkUserEnumeration(
  target: ScanTarget,
): Promise<Finding | null> {
  // Test with two different fake emails and compare responses
  const email1 = `scanner-enum-1-${Date.now()}@supabase-scanner-invalid.test`;
  const email2 = `scanner-enum-2-${Date.now()}@supabase-scanner-invalid.test`;
  const password = "TestPassword123!@#_scanner_probe";

  const [response1, response2] = await Promise.all([
    supabasePost(target, "/auth/v1/signup", { email: email1, password }),
    supabasePost(target, "/auth/v1/signup", { email: email2, password }),
  ]);

  // Try to detect if the signup endpoint leaks info about existing users
  // by checking the password recovery endpoint with a fake email
  const recoveryResponse = await supabasePost(target, "/auth/v1/recover", {
    email: email1,
  });

  // If recovery returns different status codes for existing vs non-existing users
  // that's a user enumeration vulnerability
  // For now, we check if the endpoint is accessible at all
  if (recoveryResponse.status === 200) {
    // Check if responses differ in structure (potential enumeration)
    const r1Data = response1.data as Record<string, unknown> | null;
    const r2Data = response2.data as Record<string, unknown> | null;

    if (r1Data && r2Data) {
      const r1Keys = Object.keys(r1Data).sort().join(",");
      const r2Keys = Object.keys(r2Data).sort().join(",");

      if (r1Keys !== r2Keys) {
        return createFinding({
          title: "User enumeration may be possible",
          description:
            "The authentication endpoints return different response structures for different email addresses. This could allow attackers to determine which email addresses have accounts.",
          severity: "medium",
          category: "auth",
          resource: "auth/signup",
          details: {
            signupEndpointAccessible: true,
            recoveryEndpointAccessible: recoveryResponse.status === 200,
          },
          remediation:
            "Ensure signup and recovery endpoints return consistent responses regardless of whether an email exists. Enable 'Secure email change' in Supabase Auth settings.",
        });
      }
    }
  }

  return null;
}

/**
 * Check if the auth settings endpoint is publicly accessible.
 */
async function checkAuthSettingsExposure(
  target: ScanTarget,
): Promise<Finding | null> {
  const url = `${target.supabaseUrl}/auth/v1/settings`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: target.anonKey,
      Authorization: `Bearer ${target.anonKey}`,
    },
  });

  if (response.status === 200) {
    let data: Record<string, unknown> = {};
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      return null;
    }

    const externalProviders = data.external as Record<string, unknown> | undefined;
    const enabledProviders = externalProviders
      ? Object.entries(externalProviders)
          .filter(([, v]) => v === true)
          .map(([k]) => k)
      : [];

    return createFinding({
      title: "Auth configuration is publicly readable",
      description: `The auth settings endpoint exposes configuration details including enabled providers: ${enabledProviders.join(", ") || "none detected"}. While not directly exploitable, this helps attackers understand the authentication surface.`,
      severity: "low",
      category: "auth",
      resource: "auth/settings",
      details: {
        enabledProviders,
        hasAutoconfirm: data.autoconfirm,
        disableSignup: data.disable_signup,
      },
      remediation:
        "This is generally expected behavior for Supabase. Review exposed settings and ensure they match your intended configuration.",
    });
  }

  return null;
}

export const authAuditModule: ScanModule = {
  name: "Auth Audit",

  async run(target: ScanTarget): Promise<ScanModuleResult> {
    const start = Date.now();
    const findings: Finding[] = [];

    const results = await Promise.all([
      checkEmailConfirmation(target),
      checkUserEnumeration(target),
      checkAuthSettingsExposure(target),
    ]);

    for (const finding of results) {
      if (finding) {
        findings.push(finding);
      }
    }

    return {
      module: "Auth Audit",
      findings,
      scannedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
    };
  },
};
