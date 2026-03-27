import type { Grade } from "@/types/scanner";

const GRADE_SCORES: Record<Grade, number> = {
  A: 100,
  B: 80,
  C: 60,
  D: 40,
  F: 20,
};

export function gradeToScore(grade: Grade): number {
  return GRADE_SCORES[grade];
}

export function scoreToGrade(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  if (score >= 30) return "D";
  return "F";
}
