import { describe, it, expect, vi, beforeEach } from "vitest";
import { authAuditModule } from "../modules/auth-audit";
import type { ScanTarget } from "@/types/scanner";

const target: ScanTarget = {
  supabaseUrl: "https://test.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.fake_sig",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("authAuditModule", () => {
  it("has the correct name", () => {
    expect(authAuditModule.name).toBe("Auth Audit");
  });

  it("flags disabled email confirmation", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;

      if (url.includes("/auth/v1/signup")) {
        return new Response(
          JSON.stringify({
            user: {
              id: "test-id",
              email: "test@test.com",
              confirmed_at: "2024-01-01T00:00:00Z",
            },
            session: { access_token: "fake" },
          }),
          { status: 200 },
        );
      }

      if (url.includes("/auth/v1/recover")) {
        return new Response(JSON.stringify({}), { status: 200 });
      }

      if (url.includes("/auth/v1/settings")) {
        return new Response(
          JSON.stringify({ external: { email: true } }),
          { status: 200 },
        );
      }

      return new Response(JSON.stringify({}), { status: 403 });
    });

    const result = await authAuditModule.run(target);

    expect(
      result.findings.some(
        (f) =>
          f.title.includes("Email confirmation") &&
          f.severity === "high",
      ),
    ).toBe(true);
  });

  it("flags exposed auth settings", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;

      if (url.includes("/auth/v1/settings")) {
        return new Response(
          JSON.stringify({
            external: {
              email: true,
              google: true,
              github: false,
            },
            autoconfirm: false,
            disable_signup: false,
          }),
          { status: 200 },
        );
      }

      // Signup/recover - return non-200 so no other findings
      return new Response(JSON.stringify({}), { status: 422 });
    });

    const result = await authAuditModule.run(target);

    expect(
      result.findings.some(
        (f) =>
          f.title.includes("Auth configuration") &&
          f.severity === "low",
      ),
    ).toBe(true);
  });

  it("returns timing metadata", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 403 }),
    );

    const result = await authAuditModule.run(target);

    expect(result.module).toBe("Auth Audit");
    expect(result.scannedAt).toBeDefined();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});
