"use client";

import { useEffect, useState, useCallback } from "react";
import { SiteHeader } from "@/components/site-header";
import { GradeBadge } from "@/components/grade-badge";
import type { Grade, LeaderboardEntry, LeaderboardResponse } from "@/types/scanner";

const GRADES: readonly Grade[] = ["A", "B", "C", "D", "F"];

const GRADE_BAR_COLORS: Record<Grade, string> = {
  A: "bg-emerald-500",
  B: "bg-lime-500",
  C: "bg-amber-500",
  D: "bg-orange-500",
  F: "bg-red-500",
};

function SeverityPill({
  count,
  color,
}: {
  readonly count: number;
  readonly color: string;
}) {
  if (count === 0) return null;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded ${color}`}>
      {count}
    </span>
  );
}

function LeaderboardRow({
  entry,
}: {
  readonly entry: LeaderboardEntry;
}) {
  return (
    <tr className="border-b border-sand-100 hover:bg-sand-50 transition-colors">
      <td className="py-3 px-4 text-sm text-sand-400 font-medium text-center w-12">
        #{entry.rank}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <GradeBadge grade={entry.grade} size="sm" />
          <div>
            <p className="text-sm font-medium text-sand-900">
              {entry.displayName}
            </p>
            <p className="text-xs text-sand-400">
              {new Date(entry.scanDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-sand-600 text-center">
        {entry.totalFindings}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5 justify-center">
          <SeverityPill count={entry.criticalCount} color="bg-red-100 text-red-700" />
          <SeverityPill count={entry.highCount} color="bg-orange-100 text-orange-700" />
          <SeverityPill count={entry.mediumCount} color="bg-amber-100 text-amber-700" />
          <SeverityPill count={entry.lowCount} color="bg-blue-100 text-blue-700" />
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        <a
          href={`/results/${entry.shareId}`}
          className="text-xs text-sand-500 hover:text-sand-700 underline underline-offset-2"
        >
          View
        </a>
      </td>
    </tr>
  );
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [gradeFilter, setGradeFilter] = useState<Grade | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "25" });
    if (gradeFilter) params.set("grade", gradeFilter);

    try {
      const res = await fetch(`/api/leaderboard?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [page, gradeFilter]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;
  const distribution = data?.stats.gradeDistribution ?? {};
  const maxDistribution = Math.max(
    1,
    ...GRADES.map((g) => distribution[g] ?? 0),
  );

  return (
    <main className="min-h-screen" id="main-content">
      <SiteHeader />
      <div className="max-w-4xl mx-auto px-8 pb-20">
        <h1 className="text-3xl font-semibold text-center mb-2 text-sand-900">
          Security Leaderboard
        </h1>
        <p className="text-sand-500 text-center mb-10 text-sm">
          See how Supabase projects rank on security.{" "}
          {data && (
            <span className="text-sand-700 font-medium">
              {data.stats.totalEntries.toLocaleString()} projects secured
            </span>
          )}
        </p>

        {/* Grade distribution bar */}
        {data && (
          <div className="flex items-end gap-2 justify-center mb-10 h-16">
            {GRADES.map((g) => {
              const count = distribution[g] ?? 0;
              const height = Math.max(4, (count / maxDistribution) * 56);
              const isActive = gradeFilter === g;
              return (
                <button
                  key={g}
                  onClick={() =>
                    setGradeFilter(gradeFilter === g ? null : g)
                  }
                  className={`flex flex-col items-center gap-1 transition-opacity ${
                    gradeFilter && !isActive ? "opacity-40" : ""
                  }`}
                >
                  <span className="text-xs text-sand-400">{count}</span>
                  <div
                    className={`w-10 rounded-t ${GRADE_BAR_COLORS[g]} transition-all`}
                    style={{ height: `${height}px` }}
                  />
                  <span
                    className={`text-xs font-medium ${isActive ? "text-sand-900" : "text-sand-500"}`}
                  >
                    {g}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Filter indicator */}
        {gradeFilter && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-sand-500">
              Filtering by grade {gradeFilter}
            </span>
            <button
              onClick={() => {
                setGradeFilter(null);
                setPage(1);
              }}
              className="text-xs text-sand-500 hover:text-sand-700 underline"
            >
              Clear
            </button>
          </div>
        )}

        {/* Table */}
        <div className="border border-sand-200 rounded-xl bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sand-200 bg-sand-50">
                <th className="py-2.5 px-4 text-xs font-medium text-sand-400 text-center w-12">
                  Rank
                </th>
                <th className="py-2.5 px-4 text-xs font-medium text-sand-400 text-left">
                  Project
                </th>
                <th className="py-2.5 px-4 text-xs font-medium text-sand-400 text-center">
                  Findings
                </th>
                <th className="py-2.5 px-4 text-xs font-medium text-sand-400 text-center">
                  Severity
                </th>
                <th className="py-2.5 px-4 text-xs font-medium text-sand-400 text-center w-16">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && !data && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-sand-400">
                    Loading leaderboard...
                  </td>
                </tr>
              )}
              {data && data.entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-sand-400">
                    No entries yet. Scan your project and opt in to appear here.
                  </td>
                </tr>
              )}
              {data?.entries.map((entry) => (
                <LeaderboardRow key={entry.id} entry={entry} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm text-sand-600 border border-sand-200 rounded-lg hover:bg-sand-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-sand-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm text-sand-600 border border-sand-200 rounded-lg hover:bg-sand-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center border border-sand-200 rounded-xl p-8 bg-sand-50">
          <h2 className="text-lg font-semibold text-sand-900 mb-2">
            Want to see your project here?
          </h2>
          <p className="text-sm text-sand-500 mb-4">
            Run a free security scan and opt in to the public leaderboard.
          </p>
          <a
            href="/scan"
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-sand-900 rounded-lg hover:bg-sand-800 transition-colors"
          >
            Scan Your Project
          </a>
        </div>
      </div>
    </main>
  );
}
