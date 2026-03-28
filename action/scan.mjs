import { runScan } from "../packages/scanner-core/src/index.ts";
import { writeFileSync, appendFileSync } from "fs";
import { resolve } from "path";

const THRESHOLD_SEVERITIES = {
  critical: ["critical"],
  high: ["critical", "high"],
  medium: ["critical", "high", "medium"],
};

const SEVERITY_ICONS = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🔵",
};

const SEVERITY_ORDER = ["critical", "high", "medium", "low"];

function setOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    appendFileSync(outputFile, `${name}=${value}\n`);
  }
}

function countBySeverity(findings) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) {
    counts[f.severity]++;
  }
  return counts;
}

function formatReport(result) {
  const allFindings = result.modules.flatMap((m) => m.findings);
  const sorted = [...allFindings].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );
  const counts = countBySeverity(allFindings);
  const lines = [];

  const gradeEmoji =
    result.grade === "A"
      ? "✅"
      : result.grade === "F"
        ? "❌"
        : "⚠️";

  lines.push(`## ${gradeEmoji} SupaScanner Security Report`);
  lines.push("");
  lines.push("| Property | Value |");
  lines.push("|----------|-------|");
  lines.push(`| Grade | **${result.grade}** |`);
  lines.push(`| Total Findings | ${result.totalFindings} |`);
  lines.push(`| Duration | ${result.durationMs}ms |`);
  lines.push(`| Scanned At | ${result.startedAt} |`);
  lines.push("");

  lines.push("### Finding Summary");
  lines.push("");
  lines.push("| Severity | Count |");
  lines.push("|----------|-------|");
  for (const sev of SEVERITY_ORDER) {
    lines.push(
      `| ${SEVERITY_ICONS[sev]} ${sev.charAt(0).toUpperCase() + sev.slice(1)} | ${counts[sev]} |`,
    );
  }
  lines.push("");

  if (sorted.length === 0) {
    lines.push("**No security issues found.**");
    lines.push("");
    return lines.join("\n");
  }

  lines.push("### Findings");
  lines.push("");

  lines.push("<details>");
  lines.push("<summary>Click to expand findings</summary>");
  lines.push("");

  for (const finding of sorted) {
    const icon = SEVERITY_ICONS[finding.severity];
    lines.push(
      `#### ${icon} [${finding.severity.toUpperCase()}] ${finding.title}`,
    );
    lines.push("");
    lines.push(`- **Category:** ${finding.category}`);
    lines.push(`- **Resource:** \`${finding.resource}\``);
    lines.push("");
    lines.push(finding.description);
    lines.push("");
    lines.push(`**Remediation:** ${finding.remediation}`);
    lines.push("");
  }

  lines.push("</details>");
  lines.push("");

  return lines.join("\n");
}

async function main() {
  const supabaseUrl = process.env.INPUT_SUPABASE_URL;
  const anonKey = process.env.INPUT_SUPABASE_ANON_KEY;
  const threshold = process.env.INPUT_THRESHOLD;

  if (!supabaseUrl || !anonKey) {
    console.error(
      "Error: supabase-url and supabase-anon-key inputs are required",
    );
    process.exit(2);
  }

  console.log(`Scanning ${supabaseUrl}...`);
  console.log(`Threshold: ${threshold || "none"}`);

  const result = await runScan({ supabaseUrl, anonKey });

  const allFindings = result.modules.flatMap((m) => m.findings);
  const counts = countBySeverity(allFindings);

  setOutput("grade", result.grade);
  setOutput("total_findings", String(result.totalFindings));
  setOutput("critical_count", String(counts.critical));
  setOutput("high_count", String(counts.high));

  const report = formatReport(result);
  const reportPath = resolve(
    process.env.RUNNER_TEMP || "/tmp",
    "supascanner-report.md",
  );
  writeFileSync(reportPath, report);
  setOutput("report_file", reportPath);

  console.log(`Grade: ${result.grade}`);
  console.log(`Total findings: ${result.totalFindings}`);
  console.log(
    `Critical: ${counts.critical}, High: ${counts.high}, Medium: ${counts.medium}, Low: ${counts.low}`,
  );
  console.log(`Report written to ${reportPath}`);

  let thresholdExceeded = false;
  if (threshold && threshold in THRESHOLD_SEVERITIES) {
    const failSeverities = THRESHOLD_SEVERITIES[threshold];
    const hasFailure = allFindings.some((f) =>
      failSeverities.includes(f.severity),
    );
    if (hasFailure) {
      thresholdExceeded = true;
      console.log(
        `::warning::Findings at or above '${threshold}' severity detected`,
      );
    }
  }

  setOutput("threshold_exceeded", String(thresholdExceeded));
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(2);
});
