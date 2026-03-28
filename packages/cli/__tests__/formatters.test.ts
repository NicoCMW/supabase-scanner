import { describe, it, expect } from "vitest";
import { formatJson, formatTable, formatMarkdown } from "../src/formatters.js";
import type { ScanResult } from "@supascanner/core";

const EMPTY_RESULT: ScanResult = {
  target: {
    supabaseUrl: "https://test.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.fake_sig",
  },
  modules: [
    { module: "RLS Audit", findings: [], scannedAt: "2026-01-01T00:00:00.000Z", durationMs: 50 },
    { module: "Storage Audit", findings: [], scannedAt: "2026-01-01T00:00:00.000Z", durationMs: 30 },
    { module: "Auth Audit", findings: [], scannedAt: "2026-01-01T00:00:00.000Z", durationMs: 20 },
  ],
  grade: "A",
  totalFindings: 0,
  startedAt: "2026-01-01T00:00:00.000Z",
  completedAt: "2026-01-01T00:00:00.100Z",
  durationMs: 100,
};

const RESULT_WITH_FINDINGS: ScanResult = {
  target: {
    supabaseUrl: "https://test.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.fake_sig",
  },
  modules: [
    {
      module: "RLS Audit",
      findings: [
        {
          id: "f1",
          title: 'Table "users" is publicly readable with data exposed',
          description: "The users table is publicly readable.",
          severity: "critical",
          category: "rls",
          resource: "public.users",
          details: { table: "users", schema: "public" },
          remediation: "Enable RLS on the users table.",
        },
        {
          id: "f2",
          title: 'Table "posts" is publicly accessible (empty)',
          description: "The posts table is publicly accessible.",
          severity: "high",
          category: "rls",
          resource: "public.posts",
          details: { table: "posts", schema: "public" },
          remediation: "Enable RLS on the posts table.",
        },
      ],
      scannedAt: "2026-01-01T00:00:00.000Z",
      durationMs: 50,
    },
    {
      module: "Storage Audit",
      findings: [
        {
          id: "f3",
          title: 'Storage bucket "avatars" is marked public',
          description: "The avatars bucket is public.",
          severity: "medium",
          category: "storage",
          resource: "storage/avatars",
          details: { bucketName: "avatars" },
          remediation: "Set bucket to private.",
        },
      ],
      scannedAt: "2026-01-01T00:00:00.000Z",
      durationMs: 30,
    },
    {
      module: "Auth Audit",
      findings: [
        {
          id: "f4",
          title: "Auth configuration is publicly readable",
          description: "Auth settings are exposed.",
          severity: "low",
          category: "auth",
          resource: "auth/settings",
          details: {},
          remediation: "Review settings.",
        },
      ],
      scannedAt: "2026-01-01T00:00:00.000Z",
      durationMs: 20,
    },
  ],
  grade: "D",
  totalFindings: 4,
  startedAt: "2026-01-01T00:00:00.000Z",
  completedAt: "2026-01-01T00:00:00.100Z",
  durationMs: 100,
};

describe("formatJson", () => {
  it("returns valid JSON with redacted anon key", () => {
    const output = formatJson(RESULT_WITH_FINDINGS);
    const parsed = JSON.parse(output);

    expect(parsed.target.anonKey).toBe("***REDACTED***");
    expect(parsed.target.supabaseUrl).toBe("https://test.supabase.co");
    expect(parsed.grade).toBe("D");
    expect(parsed.totalFindings).toBe(4);
  });

  it("preserves all module data", () => {
    const output = formatJson(RESULT_WITH_FINDINGS);
    const parsed = JSON.parse(output);

    expect(parsed.modules).toHaveLength(3);
    expect(parsed.modules[0].findings).toHaveLength(2);
  });

  it("handles empty results", () => {
    const output = formatJson(EMPTY_RESULT);
    const parsed = JSON.parse(output);

    expect(parsed.grade).toBe("A");
    expect(parsed.totalFindings).toBe(0);
  });
});

describe("formatTable", () => {
  it("includes grade and finding count", () => {
    const output = formatTable(RESULT_WITH_FINDINGS);

    expect(output).toContain("D");
    expect(output).toContain("4");
  });

  it("lists findings sorted by severity", () => {
    const output = formatTable(RESULT_WITH_FINDINGS);

    const criticalPos = output.indexOf("CRITICAL");
    const highPos = output.indexOf("HIGH");
    const mediumPos = output.indexOf("MEDIUM");
    const lowPos = output.indexOf("LOW");

    expect(criticalPos).toBeLessThan(highPos);
    expect(highPos).toBeLessThan(mediumPos);
    expect(mediumPos).toBeLessThan(lowPos);
  });

  it("shows no issues message for clean scan", () => {
    const output = formatTable(EMPTY_RESULT);

    expect(output).toContain("No security issues found");
  });

  it("includes the supabase URL", () => {
    const output = formatTable(RESULT_WITH_FINDINGS);

    expect(output).toContain("https://test.supabase.co");
  });
});

describe("formatMarkdown", () => {
  it("produces valid markdown with headers", () => {
    const output = formatMarkdown(RESULT_WITH_FINDINGS);

    expect(output).toContain("# Supabase Security Scan Report");
    expect(output).toContain("## Summary");
    expect(output).toContain("## Findings");
  });

  it("includes severity counts in summary table", () => {
    const output = formatMarkdown(RESULT_WITH_FINDINGS);

    expect(output).toContain("| Critical | 1 |");
    expect(output).toContain("| High | 1 |");
    expect(output).toContain("| Medium | 1 |");
    expect(output).toContain("| Low | 1 |");
  });

  it("includes finding details", () => {
    const output = formatMarkdown(RESULT_WITH_FINDINGS);

    expect(output).toContain("[CRITICAL]");
    expect(output).toContain("users");
    expect(output).toContain("**Remediation:**");
  });

  it("handles empty results", () => {
    const output = formatMarkdown(EMPTY_RESULT);

    expect(output).toContain("No security issues found");
    expect(output).not.toContain("## Findings");
  });

  it("includes URL in properties table", () => {
    const output = formatMarkdown(RESULT_WITH_FINDINGS);

    expect(output).toContain("`https://test.supabase.co`");
  });
});
