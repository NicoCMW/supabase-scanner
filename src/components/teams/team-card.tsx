import Link from "next/link";
import { GradeBadge } from "@/components/grade-badge";
import type { Grade } from "@/types/scanner";

interface TeamCardProps {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly memberCount: number;
  readonly projectCount: number;
  readonly aggregateGrade: Grade | null;
}

export function TeamCard({
  id,
  name,
  memberCount,
  projectCount,
  aggregateGrade,
}: TeamCardProps) {
  return (
    <Link
      href={`/dashboard/teams/${id}`}
      className="block p-4 bg-white border border-sand-200 rounded-lg hover:border-sand-300 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-sand-900 truncate">
            {name}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-sm text-sand-400">
            <span>
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </span>
            <span>
              {projectCount} {projectCount === 1 ? "project" : "projects"}
            </span>
          </div>
        </div>
        {aggregateGrade && <GradeBadge grade={aggregateGrade} size="sm" />}
      </div>
    </Link>
  );
}
