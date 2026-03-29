"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const DISMISSED_KEY = "supascanner_welcome_dismissed";

export function WelcomeBanner() {
  const searchParams = useSearchParams();
  const isNewSignup = searchParams.get("signup") === "true";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isNewSignup && !localStorage.getItem(DISMISSED_KEY)) {
      setVisible(true);
    }
  }, [isNewSignup]);

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="relative p-6 mb-6 bg-sand-900 text-white rounded-xl">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-sand-400 hover:text-white transition-colors"
        aria-label="Dismiss welcome banner"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
      <h2 className="text-lg font-semibold mb-1">
        Welcome to SupaScanner
      </h2>
      <p className="text-sand-300 text-sm mb-4 max-w-lg">
        Scan your Supabase project in 60 seconds. We check RLS policies,
        storage rules, and auth configuration to find security
        misconfigurations before attackers do.
      </p>
      <a
        href="/scan"
        className="inline-block px-4 py-2 bg-white text-sand-900 text-sm font-medium rounded-lg hover:bg-sand-100 transition-colors"
      >
        Run your first scan
      </a>
    </div>
  );
}
