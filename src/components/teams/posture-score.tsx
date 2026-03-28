import { GradeBadge } from "@/components/grade-badge";
import type { Grade } from "@/types/scanner";

interface PostureScoreProps {
  readonly grade: Grade | null;
  readonly totalProjects: number;
  readonly gradedProjects: number;
  readonly totalCritical: number;
  readonly totalHigh: number;
}

export function PostureScore({
  grade,
  totalProjects,
  gradedProjects,
  totalCritical,
  totalHigh,
}: PostureScoreProps) {
  return (
    <div className="p-6 bg-white border border-sand-200 rounded-lg">
      <div className="flex items-center gap-6">
        <div className="flex-shrink-0">
          {grade ? (
            <GradeBadge grade={grade} size="lg" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 border border-sand-200 rounded-full flex items-center justify-center text-sand-300 text-2xl font-semibold">
                --
              </div>
              <span className="text-sm text-sand-400">No scans yet</span>
            </div>
          )}
        </div>
        <div className="flex-1 grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-sand-400">Projects</p>
            <p className="text-2xl font-semibold text-sand-900">
              {totalProjects}
            </p>
          </div>
          <div>
            <p className="text-sm text-sand-400">Scanned</p>
            <p className="text-2xl font-semibold text-sand-900">
              {gradedProjects}
            </p>
          </div>
          <div>
            <p className="text-sm text-sand-400">Critical / High</p>
            <p className="text-2xl font-semibold text-sand-900">
              {totalCritical + totalHigh > 0 ? (
                <span className="text-red-600">
                  {totalCritical} / {totalHigh}
                </span>
              ) : (
                <span className="text-emerald-600">0 / 0</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
