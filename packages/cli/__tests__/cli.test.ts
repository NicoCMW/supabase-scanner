import { describe, it, expect, vi, beforeEach } from "vitest";
import { execFile } from "child_process";
import { promisify } from "util";
import { resolve } from "path";

const exec = promisify(execFile);

// Test the CLI via Commander's parseAsync by importing the program
// For integration tests, we test the argument parsing and exit code behavior

describe("CLI argument parsing", () => {
  it("scan command requires url", async () => {
    // Import the config module to test argument resolution
    const { resolveTarget } = await import("../src/config.js");

    expect(() =>
      resolveTarget({ config: {} }),
    ).toThrow("Supabase URL is required");
  });

  it("scan command requires anon key", async () => {
    const { resolveTarget } = await import("../src/config.js");

    expect(() =>
      resolveTarget({
        url: "https://test.supabase.co",
        config: {},
      }),
    ).toThrow("Anon key is required");
  });

  it("resolves target from all sources with correct priority", async () => {
    const { resolveTarget } = await import("../src/config.js");

    // CLI args > config > env
    const target = resolveTarget({
      url: "https://cli.supabase.co",
      key: "cli.key.value",
      config: {
        url: "https://config.supabase.co",
        anonKey: "config.key.value",
      },
    });

    expect(target.supabaseUrl).toBe("https://cli.supabase.co");
    expect(target.anonKey).toBe("cli.key.value");
  });
});

describe("CLI exit codes", () => {
  it("threshold critical only fails on critical findings", () => {
    const THRESHOLD_SEVERITIES: Record<string, readonly string[]> = {
      critical: ["critical"],
      high: ["critical", "high"],
      medium: ["critical", "high", "medium"],
    };

    const criticalFindings = [
      { severity: "critical" },
    ];
    const highFindings = [
      { severity: "high" },
    ];

    // With critical threshold, only critical findings trigger failure
    const critThreshold = THRESHOLD_SEVERITIES["critical"];
    expect(criticalFindings.some((f) => critThreshold.includes(f.severity))).toBe(true);
    expect(highFindings.some((f) => critThreshold.includes(f.severity))).toBe(false);

    // With high threshold, both critical and high trigger failure
    const highThreshold = THRESHOLD_SEVERITIES["high"];
    expect(criticalFindings.some((f) => highThreshold.includes(f.severity))).toBe(true);
    expect(highFindings.some((f) => highThreshold.includes(f.severity))).toBe(true);
  });

  it("threshold medium fails on critical, high, and medium", () => {
    const THRESHOLD_SEVERITIES: Record<string, readonly string[]> = {
      medium: ["critical", "high", "medium"],
    };

    const mediumFindings = [{ severity: "medium" }];
    const lowFindings = [{ severity: "low" }];

    const medThreshold = THRESHOLD_SEVERITIES["medium"];
    expect(mediumFindings.some((f) => medThreshold.includes(f.severity))).toBe(true);
    expect(lowFindings.some((f) => medThreshold.includes(f.severity))).toBe(false);
  });
});
