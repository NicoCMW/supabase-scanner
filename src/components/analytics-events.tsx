"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackSignup, trackUpgradeToPro } from "@/lib/analytics/gtag";

export function AnalyticsEvents() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("signup") === "true") {
      trackSignup();
    }
    if (searchParams.get("upgraded") === "true") {
      trackUpgradeToPro();
    }
  }, [searchParams]);

  return null;
}
