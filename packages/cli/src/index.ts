#!/usr/bin/env node

import { Command } from "commander";
import { runScan } from "@supascanner/core";
import type { Severity } from "@supascanner/core";
import { loadConfig, resolveTarget } from "./config.js";
import { formatJson, formatTable, formatMarkdown } from "./formatters.js";

const THRESHOLD_SEVERITIES: Record<string, readonly Severity[]> = {
  critical: ["critical"],
  high: ["critical", "high"],
  medium: ["critical", "high", "medium"],
};

const program = new Command();

program
  .name("supascanner")
  .description("Scan your Supabase project for security vulnerabilities")
  .version("0.1.0");

program
  .command("scan")
  .description("Run a security scan against a Supabase project")
  .option("--url <url>", "Supabase project URL")
  .option("--key <key>", "Supabase anon key")
  .option(
    "--format <format>",
    "Output format: json, table, or markdown",
    "table",
  )
  .option(
    "--threshold <level>",
    "Exit with code 1 if findings at or above this severity: critical, high, or medium",
  )
  .action(async (options: {
    url?: string;
    key?: string;
    format: string;
    threshold?: string;
  }) => {
    try {
      const config = await loadConfig(process.cwd());
      const format = options.format ?? config.format ?? "table";
      const threshold = options.threshold ?? config.threshold;

      const target = resolveTarget({
        url: options.url,
        key: options.key,
        config,
      });

      const result = await runScan(target);

      switch (format) {
        case "json":
          process.stdout.write(formatJson(result) + "\n");
          break;
        case "markdown":
          process.stdout.write(formatMarkdown(result) + "\n");
          break;
        case "table":
        default:
          process.stdout.write(formatTable(result) + "\n");
          break;
      }

      if (threshold && threshold in THRESHOLD_SEVERITIES) {
        const failSeverities = THRESHOLD_SEVERITIES[threshold];
        const allFindings = result.modules.flatMap((m) => m.findings);
        const hasFailure = allFindings.some((f) =>
          failSeverities.includes(f.severity),
        );

        if (hasFailure) {
          process.exit(1);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Error: ${message}\n`);
      process.exit(2);
    }
  });

program.parse();
