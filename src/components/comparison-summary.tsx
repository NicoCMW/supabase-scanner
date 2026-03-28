import { GradeBadge } from "./grade-badge";
import { gradeToScore } from "@/lib/grade-score";
import type { Grade } from "@/types/scanner";

interface ScanPair {
  readonly fromId: string;
  readonly fromGrade: Grade;
  readonly fromFindings: number;
  readonly fromDate: string;
  readonly toId: string;
  readonly toGrade: Grade;
  readonly toFindings: number;
  readonly toDate: string;
  readonly url: string;
}

interface ComparisonSummaryProps {
  readonly pair: ScanPair | null;
}

export function ComparisonSummary({ pair }: ComparisonSummaryProps) {
  if (!pair) {
    return null;
  }

  const fromScore = gradeToScore(pair.fromGrade);
  const toScore = gradeToScore(pair.toGrade);
  const scoreDelta = toScore - fromScore;
  const findingsDelta = pair.toFindings - pair.fromFindings;

  const isImproving = scoreDelta > 0;
  const isDeclining = scoreDelta < 0;

  const trendArrow = isImproving ? "\u2191" : isDeclining ? "\u2193" : "\u2192";
  const trendColor = isImproving
    ? "text-emerald-600"
    : isDeclining
      ? "text-red-600"
      : "text-sand-500";
  const trendLabel = isImproving
    ? "Improving"
    : isDeclining
      ? "Declining"
      : "Stable";

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

  return (
    <div className="p-4 bg-white border border-sand-200 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-sand-900">
          Latest Comparison
        </h2>
        <a
          href={`/dashboard/diff?from=${pair.fromId}&to=${pair.toId}`}
          className="text-xs text-sand-400 hover:text-sand-900 transition-colors underline underline-offset-2"
        >
          View full diff
        </a>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-2">
          <GradeBadge grade={pair.fromGrade} size="sm" />
          <span className="text-xs text-sand-400">
            {formatDate(pair.fromDate)}
          </span>
        </div>
        <span className={`text-lg font-semibold ${trendColor}`}>
          {trendArrow}
        </span>
        <div className="flex items-center gap-2">
          <GradeBadge grade={pair.toGrade} size="sm" />
          <span className="text-xs text-sand-400">
            {formatDate(pair.toDate)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <span className={`font-medium ${trendColor}`}>{trendLabel}</span>
        {scoreDelta !== 0 && (
          <span className={`text-xs ${trendColor}`}>
            {scoreDelta > 0 ? "+" : ""}
            {scoreDelta} pts
          </span>
        )}
        <span className="text-xs text-sand-400 ml-auto">
          Findings: {pair.fromFindings} → {pair.toFindings}
          {findingsDelta !== 0 && (
            <span
              className={
                findingsDelta < 0 ? "text-emerald-600" : "text-red-600"
              }
            >
              {" "}
              ({findingsDelta < 0 ? findingsDelta : `+${findingsDelta}`})
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
