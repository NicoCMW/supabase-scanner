export type ChangelogCategory = "feature" | "improvement" | "fix";

export interface ChangelogEntry {
  readonly id: string;
  readonly date: string;
  readonly title: string;
  readonly description: string;
  readonly category: ChangelogCategory;
  readonly image?: string;
}

const entries: readonly ChangelogEntry[] = [
  {
    id: "scheduled-scans",
    date: "2026-03-28",
    title: "Scheduled Scans for Pro Users",
    description:
      "Pro plan users can now schedule automatic security scans on a daily or weekly cadence. Get notified when your security grade changes without lifting a finger.",
    category: "feature",
  },
  {
    id: "github-action",
    date: "2026-03-27",
    title: "GitHub Action for CI/CD Security Scanning",
    description:
      "Run SupaScanner as part of your CI/CD pipeline with our official GitHub Action. Fail builds when your security grade drops below a threshold you define.",
    category: "feature",
  },
  {
    id: "team-workspaces",
    date: "2026-03-26",
    title: "Team Workspaces and Shared Scan History",
    description:
      "Invite team members to a shared workspace. Everyone on the team can view scan history, track security trends, and collaborate on fixing findings.",
    category: "feature",
  },
  {
    id: "comparison-view",
    date: "2026-03-25",
    title: "Scan Comparison View",
    description:
      "Compare any two scans side-by-side to see exactly what changed. Track which findings were resolved, which are new, and how your overall grade shifted.",
    category: "improvement",
  },
  {
    id: "pdf-reports",
    date: "2026-03-24",
    title: "Exportable PDF Security Reports",
    description:
      "Download a PDF report of any scan result. Share it with stakeholders, attach it to compliance documentation, or keep it for your records.",
    category: "feature",
  },
  {
    id: "embeddable-badge",
    date: "2026-03-23",
    title: "Embeddable Security Badge",
    description:
      "Show your security grade on your README or website with an auto-updating SVG badge. Demonstrate your commitment to security to users and contributors.",
    category: "feature",
  },
  {
    id: "slack-notifications",
    date: "2026-03-22",
    title: "Slack Integration for Scan Alerts",
    description:
      "Connect SupaScanner to your Slack workspace and receive notifications when scans complete. Get instant visibility into grade changes without leaving Slack.",
    category: "feature",
  },
  {
    id: "storage-checks",
    date: "2026-03-21",
    title: "Storage Bucket Security Checks",
    description:
      "SupaScanner now checks your Supabase Storage bucket configurations. Detect accidentally public buckets, missing RLS policies on storage.objects, and overly permissive access patterns.",
    category: "feature",
  },
  {
    id: "faster-scans",
    date: "2026-03-20",
    title: "2x Faster Scan Performance",
    description:
      "Optimized our scanning engine to run checks in parallel. Most scans now complete in under 20 seconds, down from 40 seconds at launch.",
    category: "improvement",
  },
  {
    id: "copy-paste-fixes",
    date: "2026-03-19",
    title: "Copy-Paste SQL Fixes for Every Finding",
    description:
      "Every security finding now includes a ready-to-run SQL statement that fixes the issue. Copy it, paste it into the Supabase SQL Editor, and resolve the finding in seconds.",
    category: "improvement",
  },
  {
    id: "launch",
    date: "2026-03-18",
    title: "SupaScanner Public Launch",
    description:
      "SupaScanner is live. Scan your Supabase project for RLS gaps, exposed storage buckets, and auth misconfigurations. Get an A-F security grade with actionable fixes in under 60 seconds.",
    category: "feature",
  },
];

export function getAllChangelogEntries(): readonly ChangelogEntry[] {
  return entries;
}

export function getLatestChangelogDate(): string {
  return entries[0].date;
}
