import { describe, it, expect } from "vitest";
import { validateTarget } from "../supabase-client";

describe("validateTarget", () => {
  it("accepts a valid Supabase URL and anon key", () => {
    const result = validateTarget({
      supabaseUrl: "https://abcdefghijklm.supabase.co",
      anonKey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.fake_signature_padding_to_make_it_long_enough",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects an invalid URL", () => {
    const result = validateTarget({
      supabaseUrl: "not-a-url",
      anonKey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.fake_sig",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Invalid URL"))).toBe(true);
  });

  it("rejects a non-Supabase URL", () => {
    const result = validateTarget({
      supabaseUrl: "https://example.com",
      anonKey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.fake_sig",
    });
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.includes("Supabase project URL")),
    ).toBe(true);
  });

  it("rejects a short anon key", () => {
    const result = validateTarget({
      supabaseUrl: "https://test.supabase.co",
      anonKey: "short",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("too short"))).toBe(true);
  });

  it("rejects an anon key that is not a JWT", () => {
    const result = validateTarget({
      supabaseUrl: "https://test.supabase.co",
      anonKey: "this-is-not-a-jwt-token-but-it-is-long-enough-to-pass-length-check",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("JWT"))).toBe(true);
  });

  it("accepts localhost for development", () => {
    const result = validateTarget({
      supabaseUrl: "http://localhost:54321",
      anonKey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.fake_sig",
    });
    expect(result.valid).toBe(true);
  });
});
