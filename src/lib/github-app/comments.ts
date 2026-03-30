import type { ScanResult, Finding } from "@supascanner/core";
import { getInstallationToken } from "./auth";

const SEVERITY_ICONS: Record<string, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🔵",
};

const GRADE_BADGES: Record<string, string> = {
  A: "![Grade: A](https://img.shields.io/badge/security-A%20%E2%9C%93-brightgreen)",
  B: "![Grade: B](https://img.shields.io/badge/security-B-green)",
  C: "![Grade: C](https://img.shields.io/badge/security-C-yellow)",
  D: "![Grade: D](https://img.shields.io/badge/security-D-orange)",
  F: "![Grade: F](https://img.shields.io/badge/security-F%20%E2%9C%97-red)",
};

const COMMENT_MARKER = "<!-- supascanner-pr-scan -->";

/**
 * Format scan results as a GitHub PR comment body.
 */
export function formatPrComment(
  result: ScanResult,
  siteUrl: string,
  scanJobId?: string,
): string {
  const findings = result.modules.flatMap((m) => m.findings);
  const counts = countBySeverity(findings);

  const lines: string[] = [
    COMMENT_MARKER,
    `## SupaScanner Security Report ${GRADE_BADGES[result.grade] ?? ""}`,
    "",
    `**Grade: ${result.grade}** | ${result.totalFindings} finding${result.totalFindings === 1 ? "" : "s"} | ${result.durationMs}ms`,
    "",
    "| Severity | Count |",
    "|----------|-------|",
    `| ${SEVERITY_ICONS.critical} Critical | ${counts.critical} |`,
    `| ${SEVERITY_ICONS.high} High | ${counts.high} |`,
    `| ${SEVERITY_ICONS.medium} Medium | ${counts.medium} |`,
    `| ${SEVERITY_ICONS.low} Low | ${counts.low} |`,
    "",
  ];

  if (findings.length > 0) {
    lines.push("### Findings", "");
    for (const finding of findings) {
      lines.push(
        `<details><summary>${SEVERITY_ICONS[finding.severity] ?? ""} <strong>${finding.severity.toUpperCase()}</strong>: ${finding.title}</summary>`,
        "",
        `**Resource:** \`${finding.resource}\``,
        "",
        finding.description,
        "",
        `**Remediation:** ${finding.remediation}`,
        "",
        "</details>",
        "",
      );
    }
  } else {
    lines.push(
      "> No security issues found. Your Supabase configuration looks good!",
      "",
    );
  }

  const reportLink = scanJobId
    ? `[View full report](${siteUrl}/scan/${scanJobId})`
    : "";

  lines.push(
    "---",
    `${reportLink}${reportLink ? " | " : ""}Powered by [SupaScanner](${siteUrl})`,
  );

  return lines.join("\n");
}

function countBySeverity(
  findings: readonly Finding[],
): Record<string, number> {
  const counts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  for (const f of findings) {
    counts[f.severity] = (counts[f.severity] ?? 0) + 1;
  }
  return counts;
}

/**
 * Create or update a PR comment with scan results.
 * Uses the COMMENT_MARKER to find existing comments for update.
 */
export async function upsertPrComment(
  installationId: number,
  repoFullName: string,
  prNumber: number,
  body: string,
): Promise<number> {
  const token = await getInstallationToken(installationId);
  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };

  // Check for existing comment
  const existingId = await findExistingComment(
    token,
    repoFullName,
    prNumber,
  );

  if (existingId) {
    const response = await fetch(
      `https://api.github.com/repos/${repoFullName}/issues/comments/${existingId}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ body }),
      },
    );
    if (!response.ok) {
      throw new Error(`Failed to update comment (${response.status})`);
    }
    return existingId;
  }

  // Create new comment
  const response = await fetch(
    `https://api.github.com/repos/${repoFullName}/issues/${prNumber}/comments`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ body }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to create comment (${response.status})`);
  }

  const data = (await response.json()) as { id: number };
  return data.id;
}

async function findExistingComment(
  token: string,
  repoFullName: string,
  prNumber: number,
): Promise<number | null> {
  const response = await fetch(
    `https://api.github.com/repos/${repoFullName}/issues/${prNumber}/comments?per_page=100`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!response.ok) return null;

  const comments = (await response.json()) as Array<{
    id: number;
    body: string;
  }>;

  const existing = comments.find((c) => c.body.includes(COMMENT_MARKER));
  return existing?.id ?? null;
}
