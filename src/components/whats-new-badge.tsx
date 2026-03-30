"use client";

import { useState, useEffect } from "react";

const SEEN_KEY = "supascanner_changelog_seen";

interface WhatsNewBadgeProps {
  readonly latestDate: string;
}

export function WhatsNewBadge({ latestDate }: WhatsNewBadgeProps) {
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(SEEN_KEY);
    if (!seen || seen < latestDate) {
      setHasNew(true);
    }
  }, [latestDate]);

  function handleClick() {
    localStorage.setItem(SEEN_KEY, latestDate);
    setHasNew(false);
  }

  return (
    <a
      href="/changelog"
      onClick={handleClick}
      className="text-sm text-sand-400 hover:text-sand-900 transition-colors relative"
    >
      What&apos;s New
      {hasNew && (
        <span
          className="absolute -top-1 -right-2 w-2 h-2 bg-sand-900 rounded-full"
          aria-label="New updates available"
        />
      )}
    </a>
  );
}
