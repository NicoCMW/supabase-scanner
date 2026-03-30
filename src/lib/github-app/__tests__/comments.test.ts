import { describe, it, expect } from "vitest";
import { formatPrComment } from "../comments";
import type { ScanResult } from "@/types/scanner";

function makeScanResult(overrides: Partial<ScanResult> = {}): ScanResult {
  return {
    target: { supabaseUrl: "https://test.supabase.co", anonKey: "key" },
    modules: [],
    grade: "A",
    totalFindings: 0,
    startedAt: "2026-01-01T00:00:00.000Z",
    completedAt: "2026-01-01T00:00:01.000Z",
    durationMs: 1000,
    ...overrides,
  };
}

describe("formatPrComment", () => {
  it("includes the comment marker for upsert detection", () => {
    const result = makeScanResult();
    const comment = formatPrComment(result, "https://supascanner.com");
    expect(comment).toContain("<!-- supascanner-pr-scan -->");
  });

  it("shows grade A with pass badge", () => {
    const result = makeScanResult({ grade: "A" });
    const comment = formatPrComment(result, "https://supascanner.com");
    expect(comment).toContain("Grade: A");
    expect(comment).toContain("security-A");
  });

  it("shows grade F with fail badge", () => {
    const result = makeScanResult({ grade: "F", totalFindings: 5 });
    const comment = formatPrComment(result, "https://supascanner.com");
    expect(comment).toContain("Grade: F");
    expect(comment).toContain("security-F");
  });

  it("shows severity counts in summary table", () => {
    const result = makeScanResult({
      grade: "C",
      totalFindings: 3,
      modules: [
        {
          module: "rls-audit",
          scannedAt: "2026-01-01T00:00:00.000Z",
          durationMs: 500,
          findings: [
            {
              id: "1",
              title: "Public table",
              description: "Table is public",
              severity: "critical",
              category: "rls",
              resource: "public.users",
              details: {},
              remediation: "Add RLS",
            },
            {
              id: "2",
              title: "Writable table",
              description: "Table allows writes",
              severity: "high",
              category: "rls",
              resource: "public.orders",
              details: {},
              remediation: "Add RLS",
            },
            {
              id: "3",
              title: "Minor issue",
              description: "Minor",
              severity: "low",
              category: "rls",
              resource: "public.logs",
              details: {},
              remediation: "Review",
            },
          ],
        },
      ],
    });

    const comment = formatPrComment(result, "https://supascanner.com");
    expect(comment).toContain("Critical | 1");
    expect(comment).toContain("High | 1");
    expect(comment).toContain("Medium | 0");
    expect(comment).toContain("Low | 1");
  });

  it("includes expandable finding details", () => {
    const result = makeScanResult({
      grade: "D",
      totalFindings: 1,
      modules: [
        {
          module: "rls-audit",
          scannedAt: "2026-01-01T00:00:00.000Z",
          durationMs: 200,
          findings: [
            {
              id: "1",
              title: "Public table exposed",
              description: "The users table is publicly readable",
              severity: "critical",
              category: "rls",
              resource: "public.users",
              details: {},
              remediation: "Enable RLS on the users table",
            },
          ],
        },
      ],
    });

    const comment = formatPrComment(result, "https://supascanner.com");
    expect(comment).toContain("<details>");
    expect(comment).toContain("Public table exposed");
    expect(comment).toContain("Enable RLS on the users table");
    expect(comment).toContain("`public.users`");
  });

  it("shows no-issues message for clean scans", () => {
    const result = makeScanResult();
    const comment = formatPrComment(result, "https://supascanner.com");
    expect(comment).toContain("No security issues found");
  });

  it("includes report link when scanJobId provided", () => {
    const result = makeScanResult();
    const comment = formatPrComment(
      result,
      "https://supascanner.com",
      "abc-123",
    );
    expect(comment).toContain(
      "[View full report](https://supascanner.com/scan/abc-123)",
    );
  });

  it("includes powered-by footer", () => {
    const result = makeScanResult();
    const comment = formatPrComment(result, "https://supascanner.com");
    expect(comment).toContain("Powered by [SupaScanner]");
  });
});
