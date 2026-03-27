import type { ScanResult, Grade, Finding } from "@/types/scanner";
import { generateFixExplanations, type FixExplanation } from "./generate-fix";

export interface ScanReport {
  readonly grade: Grade;
  readonly totalFindings: number;
  readonly criticalCount: number;
  readonly highCount: number;
  readonly mediumCount: number;
  readonly lowCount: number;
  readonly modules: readonly {
    readonly name: string;
    readonly findingCount: number;
    readonly findings: readonly {
      readonly finding: Finding;
      readonly fix: FixExplanation;
    }[];
  }[];
  readonly durationMs: number;
  readonly scannedAt: string;
}

export async function buildReport(
  scanResult: ScanResult,
): Promise<ScanReport> {
  const allFindings = scanResult.modules.flatMap((m) => m.findings);
  const fixes = await generateFixExplanations(allFindings);
  const fixMap = new Map(fixes.map((f) => [f.findingId, f]));

  const modules = scanResult.modules.map((m) => ({
    name: m.module,
    findingCount: m.findings.length,
    findings: m.findings.map((finding) => ({
      finding,
      fix: fixMap.get(finding.id) ?? {
        findingId: finding.id,
        explanation: finding.description,
        sqlSnippet: null,
        steps: [finding.remediation],
      },
    })),
  }));

  return {
    grade: scanResult.grade,
    totalFindings: scanResult.totalFindings,
    criticalCount: allFindings.filter((f) => f.severity === "critical").length,
    highCount: allFindings.filter((f) => f.severity === "high").length,
    mediumCount: allFindings.filter((f) => f.severity === "medium").length,
    lowCount: allFindings.filter((f) => f.severity === "low").length,
    modules,
    durationMs: scanResult.durationMs,
    scannedAt: scanResult.startedAt,
  };
}

export type { FixExplanation } from "./generate-fix";
