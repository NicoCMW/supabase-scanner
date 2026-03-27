import { describe, it, expect } from "vitest";
import { buildReport } from "../index";
import type { ScanResult } from "@/types/scanner";
import { createFinding } from "@/lib/scanner/utils";

describe("buildReport", () => {
  it("builds a report from scan results", async () => {
    const scanResult: ScanResult = {
      target: {
        supabaseUrl: "https://test.supabase.co",
        anonKey: "test-key",
      },
      modules: [
        {
          module: "RLS Audit",
          findings: [
            createFinding({
              title: "Critical RLS issue",
              description: "desc",
              severity: "critical",
              category: "rls",
              resource: "public.users",
              details: {},
              remediation: "fix it",
            }),
          ],
          scannedAt: new Date().toISOString(),
          durationMs: 100,
        },
        {
          module: "Storage Audit",
          findings: [
            createFinding({
              title: "Medium storage issue",
              description: "desc",
              severity: "medium",
              category: "storage",
              resource: "storage/avatars",
              details: {},
              remediation: "fix it",
            }),
          ],
          scannedAt: new Date().toISOString(),
          durationMs: 50,
        },
        {
          module: "Auth Audit",
          findings: [],
          scannedAt: new Date().toISOString(),
          durationMs: 30,
        },
      ],
      grade: "C",
      totalFindings: 2,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: 180,
    };

    const report = await buildReport(scanResult);

    expect(report.grade).toBe("C");
    expect(report.totalFindings).toBe(2);
    expect(report.criticalCount).toBe(1);
    expect(report.mediumCount).toBe(1);
    expect(report.highCount).toBe(0);
    expect(report.lowCount).toBe(0);
    expect(report.modules).toHaveLength(3);
    expect(report.modules[0].findings).toHaveLength(1);
    expect(report.modules[0].findings[0].fix).toBeDefined();
    expect(report.modules[0].findings[0].fix.sqlSnippet).toContain("ROW LEVEL SECURITY");
  });
});
