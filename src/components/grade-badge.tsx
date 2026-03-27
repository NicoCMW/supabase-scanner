import type { Grade } from "@/types/scanner";

const GRADE_COLORS: Record<Grade, string> = {
  A: "bg-emerald-100 text-emerald-700 border-emerald-200",
  B: "bg-lime-100 text-lime-700 border-lime-200",
  C: "bg-amber-100 text-amber-700 border-amber-200",
  D: "bg-orange-100 text-orange-700 border-orange-200",
  F: "bg-red-100 text-red-700 border-red-200",
};

const GRADE_LABELS: Record<Grade, string> = {
  A: "Excellent",
  B: "Good",
  C: "Needs Improvement",
  D: "Poor",
  F: "Critical",
};

interface GradeBadgeProps {
  readonly grade: Grade;
  readonly size?: "sm" | "lg";
}

export function GradeBadge({ grade, size = "lg" }: GradeBadgeProps) {
  const sizeClass =
    size === "lg" ? "w-20 h-20 text-4xl" : "w-9 h-9 text-lg";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`${GRADE_COLORS[grade]} ${sizeClass} border rounded-full flex items-center justify-center font-semibold`}
      >
        {grade}
      </div>
      {size === "lg" && (
        <span className="text-sm text-sand-500">{GRADE_LABELS[grade]}</span>
      )}
    </div>
  );
}
