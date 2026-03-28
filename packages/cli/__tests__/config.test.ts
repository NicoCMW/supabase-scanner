import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadConfig, resolveTarget } from "../src/config.js";
import { writeFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

describe("loadConfig", () => {
  const testDir = join(tmpdir(), `supascanner-test-${Date.now()}`);

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("returns empty config when file does not exist", async () => {
    const config = await loadConfig(testDir);
    expect(config).toEqual({});
  });

  it("reads config from .supascanner.config.json", async () => {
    const configContent = {
      url: "https://my-project.supabase.co",
      anonKey: "my-anon-key",
      format: "json",
      threshold: "high",
    };

    await writeFile(
      join(testDir, ".supascanner.config.json"),
      JSON.stringify(configContent),
    );

    const config = await loadConfig(testDir);
    expect(config.url).toBe("https://my-project.supabase.co");
    expect(config.format).toBe("json");
    expect(config.threshold).toBe("high");
  });

  it("handles malformed JSON gracefully", async () => {
    await writeFile(
      join(testDir, ".supascanner.config.json"),
      "not valid json {{{",
    );

    const config = await loadConfig(testDir);
    expect(config).toEqual({});
  });
});

describe("resolveTarget", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("uses CLI options first", () => {
    const target = resolveTarget({
      url: "https://cli.supabase.co",
      key: "cli-key.part2.part3",
      config: {
        url: "https://config.supabase.co",
        anonKey: "config-key",
      },
    });

    expect(target.supabaseUrl).toBe("https://cli.supabase.co");
    expect(target.anonKey).toBe("cli-key.part2.part3");
  });

  it("falls back to config file", () => {
    const target = resolveTarget({
      config: {
        url: "https://config.supabase.co",
        anonKey: "config-key.part2.part3",
      },
    });

    expect(target.supabaseUrl).toBe("https://config.supabase.co");
    expect(target.anonKey).toBe("config-key.part2.part3");
  });

  it("falls back to environment variables", () => {
    process.env.SUPABASE_URL = "https://env.supabase.co";
    process.env.SUPABASE_ANON_KEY = "env-key.part2.part3";

    const target = resolveTarget({ config: {} });

    expect(target.supabaseUrl).toBe("https://env.supabase.co");
    expect(target.anonKey).toBe("env-key.part2.part3");
  });

  it("throws when URL is missing", () => {
    expect(() =>
      resolveTarget({
        key: "some-key.part2.part3",
        config: {},
      }),
    ).toThrow("Supabase URL is required");
  });

  it("throws when anon key is missing", () => {
    expect(() =>
      resolveTarget({
        url: "https://test.supabase.co",
        config: {},
      }),
    ).toThrow("Anon key is required");
  });

  it("prefers CLI option over env var", () => {
    process.env.SUPABASE_URL = "https://env.supabase.co";

    const target = resolveTarget({
      url: "https://cli.supabase.co",
      key: "key.part2.part3",
      config: {},
    });

    expect(target.supabaseUrl).toBe("https://cli.supabase.co");
  });
});
