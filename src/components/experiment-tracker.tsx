"use client";

import { useEffect, useRef } from "react";
import { pushAllExperimentAssignments } from "@/lib/ab-testing/tracking";

type ExperimentTrackerProps = {
  readonly assignments: Readonly<Record<string, string>>;
};

export function ExperimentTracker({ assignments }: ExperimentTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    pushAllExperimentAssignments(assignments);
  }, [assignments]);

  return null;
}
