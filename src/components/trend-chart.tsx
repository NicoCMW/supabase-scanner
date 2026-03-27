"use client";

import { gradeToScore } from "@/lib/grade-score";
import type { Grade } from "@/types/scanner";

interface DataPoint {
  readonly date: string;
  readonly grade: Grade;
  readonly score: number;
}

interface TrendChartProps {
  readonly scans: readonly {
    readonly grade: Grade;
    readonly created_at: string;
  }[];
}

const CHART_WIDTH = 600;
const CHART_HEIGHT = 200;
const PADDING = { top: 20, right: 20, bottom: 40, left: 40 };
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

const GRADE_THRESHOLDS = [
  { score: 90, label: "A", color: "#059669" },
  { score: 70, label: "B", color: "#65a30d" },
  { score: 50, label: "C", color: "#d97706" },
  { score: 30, label: "D", color: "#ea580c" },
  { score: 0, label: "F", color: "#dc2626" },
];

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TrendChart({ scans }: TrendChartProps) {
  const points: readonly DataPoint[] = scans
    .filter((s) => s.grade != null)
    .map((s) => ({
      date: s.created_at,
      grade: s.grade,
      score: gradeToScore(s.grade),
    }))
    .reverse();

  if (points.length < 2) {
    return (
      <div className="p-6 bg-white border border-sand-200 rounded-xl text-center">
        <p className="text-sm text-sand-400">
          Run at least 2 scans to see your security score trend.
        </p>
      </div>
    );
  }

  const xScale = (i: number) =>
    PADDING.left + (i / (points.length - 1)) * PLOT_WIDTH;
  const yScale = (score: number) =>
    PADDING.top + PLOT_HEIGHT - (score / 100) * PLOT_HEIGHT;

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(p.score)}`)
    .join(" ");

  const areaD = `${pathD} L ${xScale(points.length - 1)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`;

  const yGridLines = [20, 40, 60, 80, 100];

  const maxLabels = 6;
  const labelStep = Math.max(1, Math.ceil(points.length / maxLabels));

  return (
    <div className="p-6 bg-white border border-sand-200 rounded-xl">
      <h2 className="text-base font-semibold text-sand-900 mb-4">
        Security Score Trend
      </h2>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full h-auto"
        role="img"
        aria-label="Security score trend chart"
      >
        {yGridLines.map((score) => (
          <g key={score}>
            <line
              x1={PADDING.left}
              y1={yScale(score)}
              x2={CHART_WIDTH - PADDING.right}
              y2={yScale(score)}
              stroke="#e8e5e0"
              strokeWidth="1"
            />
            <text
              x={PADDING.left - 8}
              y={yScale(score) + 4}
              textAnchor="end"
              fontSize="10"
              fill="#a8a29e"
            >
              {score}
            </text>
          </g>
        ))}

        {GRADE_THRESHOLDS.slice(0, -1).map((t) => (
          <text
            key={t.label}
            x={CHART_WIDTH - PADDING.right + 4}
            y={yScale(t.score) + 4}
            fontSize="9"
            fill={t.color}
            fontWeight="600"
          >
            {t.label}
          </text>
        ))}

        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c1917" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#1c1917" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#areaGrad)" />

        <path
          d={pathD}
          fill="none"
          stroke="#1c1917"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={xScale(i)}
              cy={yScale(p.score)}
              r="4"
              fill="white"
              stroke="#1c1917"
              strokeWidth="2"
            />
            <title>
              {formatShortDate(p.date)}: Grade {p.grade} ({p.score})
            </title>
          </g>
        ))}

        {points.map((p, i) =>
          i % labelStep === 0 || i === points.length - 1 ? (
            <text
              key={`label-${i}`}
              x={xScale(i)}
              y={CHART_HEIGHT - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#a8a29e"
            >
              {formatShortDate(p.date)}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}
