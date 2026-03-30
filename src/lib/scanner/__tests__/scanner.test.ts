import { describe, it, expect, vi, beforeEach } from "vitest";
import { runScan, validateTarget } from "../index";
import type { ScanTarget } from "@/types/scanner";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("runScan", () => {
  it("throws on invalid target", async () => {
    await expect(
      runScan({ supabaseUrl: "bad", anonKey: "bad" }),
    ).rejects.toThrow("Invalid scan target");
  });

  it("orchestrates all modules and computes grade", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 403 }),
    );

    const target: ScanTarget = {
      supabaseUrl: "https://test.supabase.co",
      anonKey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.fake_sig",
    };

    const result = await runScan(target);

    expect(result.target).toEqual(target);
    expect(result.modules).toHaveLength(5);
    expect(result.modules.map((m) => m.module)).toEqual([
      "RLS Audit",
      "Storage Audit",
      "Auth Audit",
      "Auth Security",
      "Edge Functions Audit",
    ]);
    expect(["A", "B", "C", "D", "F"]).toContain(result.grade);
    expect(result.totalFindings).toBeGreaterThanOrEqual(0);
    expect(result.startedAt).toBeDefined();
    expect(result.completedAt).toBeDefined();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});

describe("validateTarget (re-exported)", () => {
  it("is accessible from the index module", () => {
    expect(typeof validateTarget).toBe("function");
  });
});
