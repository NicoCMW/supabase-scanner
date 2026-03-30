import { describe, it, expect } from "vitest";
import { filterSupabaseFiles, hasSupabaseChanges } from "../files";

describe("filterSupabaseFiles", () => {
  it("matches .env files", () => {
    const files = [".env", ".env.local", ".env.production", "README.md"];
    expect(filterSupabaseFiles(files)).toEqual([
      ".env",
      ".env.local",
      ".env.production",
    ]);
  });

  it("matches supabase directory files", () => {
    const files = ["supabase/migrations/001.sql", "supabase/config.toml"];
    expect(filterSupabaseFiles(files)).toEqual(files);
  });

  it("matches SQL files", () => {
    const files = ["db/schema.sql", "src/app.ts"];
    expect(filterSupabaseFiles(files)).toEqual(["db/schema.sql"]);
  });

  it("matches migration directory files", () => {
    const files = ["db/migrations/001_init.ts", "src/index.ts"];
    expect(filterSupabaseFiles(files)).toEqual(["db/migrations/001_init.ts"]);
  });

  it("matches policies directory files", () => {
    const files = ["src/policies/rls.ts"];
    expect(filterSupabaseFiles(files)).toEqual(["src/policies/rls.ts"]);
  });

  it("matches .supascanner.yml", () => {
    const files = [".supascanner.yml", "package.json"];
    expect(filterSupabaseFiles(files)).toEqual([".supascanner.yml"]);
  });

  it("matches files with supabase in the path", () => {
    const files = ["lib/supabase/client.ts"];
    expect(filterSupabaseFiles(files)).toEqual(["lib/supabase/client.ts"]);
  });

  it("returns empty for non-matching files", () => {
    const files = ["src/app.ts", "package.json", "README.md"];
    expect(filterSupabaseFiles(files)).toEqual([]);
  });
});

describe("hasSupabaseChanges", () => {
  it("returns true when supabase files present", () => {
    expect(hasSupabaseChanges(["src/app.ts", ".env.local"])).toBe(true);
  });

  it("returns false when no supabase files present", () => {
    expect(hasSupabaseChanges(["src/app.ts", "README.md"])).toBe(false);
  });

  it("returns false for empty array", () => {
    expect(hasSupabaseChanges([])).toBe(false);
  });
});
