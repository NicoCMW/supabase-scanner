"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { OnboardingWizard, hasCompletedOnboarding } from "@/components/onboarding-wizard";
import { EmptyDashboard } from "@/components/empty-dashboard";

export function OnboardingGate() {
  const searchParams = useSearchParams();
  const isNewSignup = searchParams.get("signup") === "true";
  const [showWizard, setShowWizard] = useState<boolean | null>(null);

  useEffect(() => {
    const completed = hasCompletedOnboarding();
    setShowWizard(isNewSignup && !completed);
  }, [isNewSignup]);

  // Still loading client-side check
  if (showWizard === null) {
    return <EmptyDashboard />;
  }

  if (showWizard) {
    return <OnboardingWizard />;
  }

  return <EmptyDashboard />;
}
