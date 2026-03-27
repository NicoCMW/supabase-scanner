import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateFixExplanation, generateFixExplanations } from "../generate-fix";
import { createFinding } from "@/lib/scanner/utils";
import type { Finding } from "@/types/scanner";

beforeEach(() => {
  vi.restoreAllMocks();
  // Clear the env var so tests use static fallback by default
  delete process.env.ANTHROPIC_API_KEY;
});

const testFinding: Finding = createFinding({
  title: "Table users is publicly readable",
  description: "The users table returns data with anon key",
  severity: "critical",
  category: "rls",
  resource: "public.users",
  details: {},
  remediation: "Enable RLS on the users table",
});

describe("generateFixExplanation", () => {
  it("returns static fix when no API key is set", async () => {
    const fix = await generateFixExplanation(testFinding);

    expect(fix.findingId).toBe(testFinding.id);
    expect(fix.explanation).toBeDefined();
    expect(fix.steps.length).toBeGreaterThan(0);
  });

  it("returns SQL snippet for RLS findings", async () => {
    const fix = await generateFixExplanation(testFinding);

    expect(fix.sqlSnippet).toBeDefined();
    expect(fix.sqlSnippet).toContain("ROW LEVEL SECURITY");
  });

  it("returns SQL snippet for storage findings", async () => {
    const storageFinding = createFinding({
      title: "Bucket is public",
      description: "The avatars bucket is public",
      severity: "medium",
      category: "storage",
      resource: "storage/avatars",
      details: {},
      remediation: "Set bucket to private",
    });

    const fix = await generateFixExplanation(storageFinding);

    expect(fix.sqlSnippet).toContain("storage.objects");
  });

  it("falls back to static fix when API call fails", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    const fix = await generateFixExplanation(testFinding);

    expect(fix.findingId).toBe(testFinding.id);
    expect(fix.explanation).toBeDefined();
  });
});

describe("generateFixExplanations", () => {
  it("processes multiple findings in parallel", async () => {
    const findings = [
      testFinding,
      createFinding({
        title: "Second finding",
        description: "desc",
        severity: "low",
        category: "auth",
        resource: "auth",
        details: {},
        remediation: "fix it",
      }),
    ];

    const fixes = await generateFixExplanations(findings);

    expect(fixes).toHaveLength(2);
    expect(fixes[0].findingId).toBe(findings[0].id);
    expect(fixes[1].findingId).toBe(findings[1].id);
  });
});
