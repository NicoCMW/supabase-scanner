import type { Grade } from "@/types/scanner";

interface GradeDistributionProps {
  readonly projects: readonly { readonly grade: string | null }[];
}

const GRADE_ORDER: readonly Grade[] = ["A", "B", "C", "D", "F"];

const GRADE_BAR_COLORS: Record<Grade, string> = {
  A: "bg-emerald-500",
  B: "bg-lime-500",
  C: "bg-amber-500",
  D: "bg-orange-500",
  F: "bg-red-500",
};

export function GradeDistribution({ projects }: GradeDistributionProps) {
  const counts = GRADE_ORDER.reduce(
    (acc, g) => ({
      ...acc,
      [g]: projects.filter((p) => p.grade === g).length,
    }),
    {} as Record<Grade, number>,
  );

  const total = projects.filter((p) => p.grade !== null).length;

  if (total === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-white border border-sand-200 rounded-lg">
      <p className="text-sm font-medium text-sand-700 mb-3">
        Grade Distribution
      </p>
      <div className="flex h-6 rounded-full overflow-hidden bg-sand-100">
        {GRADE_ORDER.map((grade) => {
          const count = counts[grade];
          if (count === 0) return null;
          const pct = (count / total) * 100;
          return (
            <div
              key={grade}
              className={`${GRADE_BAR_COLORS[grade]} flex items-center justify-center text-white text-xs font-medium`}
              style={{ width: `${pct}%` }}
              title={`${grade}: ${count}`}
            >
              {pct >= 12 ? grade : ""}
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-2">
        {GRADE_ORDER.map((grade) => (
          <div key={grade} className="flex items-center gap-1 text-xs text-sand-500">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${GRADE_BAR_COLORS[grade]}`}
            />
            {grade}: {counts[grade]}
          </div>
        ))}
      </div>
    </div>
  );
}
