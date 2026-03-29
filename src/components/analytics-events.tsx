"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackSignup, trackUpgradeToPro } from "@/lib/analytics/gtag";
import { trackAccountCreated, trackCheckoutCompleted } from "@/lib/analytics/datalayer";

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function AnalyticsEvents() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("signup") === "true") {
      trackSignup();
      // Push account_created to dataLayer with hashed user ID placeholder.
      // The auth callback uses OTP (magic link) which is always email-based.
      sha256(`user-${Date.now()}`).then((hash) => {
        trackAccountCreated("email", hash);
      });
    }
    if (searchParams.get("upgraded") === "true") {
      trackUpgradeToPro();
      const sessionId = searchParams.get("session_id") ?? "";
      trackCheckoutCompleted("Pro", sessionId);
    }
  }, [searchParams]);

  return null;
}
