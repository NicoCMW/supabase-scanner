import type { Finding, ScanResult, Severity } from "@supascanner/core";

const SEVERITY_ORDER: readonly Severity[] = ["critical", "high", "medium", "low"];

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "\x1b[91m",
  high: "\x1b[31m",
  medium: "\x1b[33m",
  low: "\x1b[36m",
};

const GRADE_COLORS: Record<string, string> = {
  A: "\x1b[32m",
  B: "\x1b[32m",
  C: "\x1b[33m",
  D: "\x1b[31m",
  F: "\x1b[91m",
};

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

function sortFindings(findings: readonly Finding[]): readonly Finding[] {
  return [...findings].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );
}

function countBySeverity(findings: readonly Finding[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) {
    counts[f.severity]++;
  }
  return counts;
}

export function formatJson(result: ScanResult): string {
  const sanitized = {
    ...result,
    target: {
      supabaseUrl: result.target.supabaseUrl,
      anonKey: "***REDACTED***",
    },
  };
  return JSON.stringify(sanitized, null, 2);
}

export function formatTable(result: ScanResult): string {
  const allFindings = result.modules.flatMap((m) => m.findings);
  const sorted = sortFindings(allFindings);
  const counts = countBySeverity(allFindings);
  const lines: string[] = [];

  const gradeColor = GRADE_COLORS[result.grade] ?? "";
  lines.push("");
  lines.push(`${BOLD}Supabase Security Scan Results${RESET}`);
  lines.push(`${DIM}${"─".repeat(60)}${RESET}`);
  lines.push(`  URL:      ${result.target.supabaseUrl}`);
  lines.push(`  Grade:    ${gradeColor}${BOLD}${result.grade}${RESET}`);
  lines.push(`  Findings: ${result.totalFindings}`);
  lines.push(`  Duration: ${result.durationMs}ms`);
  lines.push("");

  lines.push(`  ${SEVERITY_COLORS.critical}Critical: ${counts.critical}${RESET}  ${SEVERITY_COLORS.high}High: ${counts.high}${RESET}  ${SEVERITY_COLORS.medium}Medium: ${counts.medium}${RESET}  ${SEVERITY_COLORS.low}Low: ${counts.low}${RESET}`);
  lines.push("");

  if (sorted.length === 0) {
    lines.push(`  ${BOLD}No security issues found.${RESET}`);
    lines.push("");
    return lines.join("\n");
  }

  lines.push(`${DIM}${"─".repeat(60)}${RESET}`);

  for (const finding of sorted) {
    const color = SEVERITY_COLORS[finding.severity];
    lines.push(`  ${color}${BOLD}[${finding.severity.toUpperCase()}]${RESET} ${finding.title}`);
    lines.push(`  ${DIM}${finding.description}${RESET}`);
    lines.push(`  ${DIM}Fix: ${finding.remediation}${RESET}`);
    lines.push("");
  }

  return lines.join("\n");
}

export function formatMarkdown(result: ScanResult): string {
  const allFindings = result.modules.flatMap((m) => m.findings);
  const sorted = sortFindings(allFindings);
  const counts = countBySeverity(allFindings);
  const lines: string[] = [];

  lines.push("# Supabase Security Scan Report");
  lines.push("");
  lines.push(`| Property | Value |`);
  lines.push(`|----------|-------|`);
  lines.push(`| URL | \`${result.target.supabaseUrl}\` |`);
  lines.push(`| Grade | **${result.grade}** |`);
  lines.push(`| Total Findings | ${result.totalFindings} |`);
  lines.push(`| Duration | ${result.durationMs}ms |`);
  lines.push(`| Scanned At | ${result.startedAt} |`);
  lines.push("");

  lines.push("## Summary");
  lines.push("");
  lines.push(`| Severity | Count |`);
  lines.push(`|----------|-------|`);
  for (const sev of SEVERITY_ORDER) {
    lines.push(`| ${sev.charAt(0).toUpperCase() + sev.slice(1)} | ${counts[sev]} |`);
  }
  lines.push("");

  if (sorted.length === 0) {
    lines.push("No security issues found.");
    lines.push("");
    return lines.join("\n");
  }

  lines.push("## Findings");
  lines.push("");

  for (const finding of sorted) {
    lines.push(`### [${finding.severity.toUpperCase()}] ${finding.title}`);
    lines.push("");
    lines.push(`- **Category:** ${finding.category}`);
    lines.push(`- **Resource:** \`${finding.resource}\``);
    lines.push("");
    lines.push(finding.description);
    lines.push("");
    lines.push(`**Remediation:** ${finding.remediation}`);
    lines.push("");
  }

  return lines.join("\n");
}
