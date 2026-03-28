"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface TeamNavProps {
  readonly teamId: string;
}

const TABS = [
  { label: "Dashboard", segment: "" },
  { label: "Projects", segment: "/projects" },
  { label: "Members", segment: "/members" },
] as const;

export function TeamNav({ teamId }: TeamNavProps) {
  const pathname = usePathname();
  const basePath = `/dashboard/teams/${teamId}`;

  return (
    <nav className="flex gap-1 border-b border-sand-200 mb-6">
      {TABS.map((tab) => {
        const href = `${basePath}${tab.segment}`;
        const isActive =
          tab.segment === ""
            ? pathname === basePath
            : pathname.startsWith(href);

        return (
          <Link
            key={tab.segment}
            href={href}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-sand-900 text-sand-900"
                : "border-transparent text-sand-400 hover:text-sand-700"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
