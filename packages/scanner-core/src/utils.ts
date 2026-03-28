import type { Finding, Grade, Severity } from "./types";
import { randomUUID } from "crypto";

const SEVERITY_SCORES: Record<Severity, number> = {
  critical: 10,
  high: 7,
  medium: 4,
  low: 1,
};

export function computeGrade(findings: readonly Finding[]): Grade {
  if (findings.length === 0) return "A";

  const totalScore = findings.reduce(
    (sum, f) => sum + SEVERITY_SCORES[f.severity],
    0,
  );

  if (totalScore >= 30) return "F";
  if (totalScore >= 20) return "D";
  if (totalScore >= 10) return "C";
  if (totalScore >= 5) return "B";
  return "A";
}

export function createFinding(
  params: Omit<Finding, "id">,
): Finding {
  return {
    id: randomUUID(),
    ...params,
  };
}
