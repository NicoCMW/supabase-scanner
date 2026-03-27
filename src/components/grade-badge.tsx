import type { Grade } from "@/types/scanner";

const GRADE_COLORS: Record<Grade, string> = {
  A: "bg-emerald-500 text-white",
  B: "bg-lime-500 text-white",
  C: "bg-yellow-500 text-gray-900",
  D: "bg-orange-500 text-white",
  F: "bg-red-600 text-white",
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
    size === "lg"
      ? "w-24 h-24 text-5xl"
      : "w-10 h-10 text-xl";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`${GRADE_COLORS[grade]} ${sizeClass} rounded-full flex items-center justify-center font-bold`}
      >
        {grade}
      </div>
      {size === "lg" && (
        <span className="text-sm text-gray-400">{GRADE_LABELS[grade]}</span>
      )}
    </div>
  );
}
