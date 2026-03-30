import { describe, it, expect, vi, beforeEach } from "vitest";
import { edgeFunctionsAuditModule } from "../modules/edge-functions-audit";
import type { ScanTarget } from "@/types/scanner";

const anonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDAzNjAwfQ.fake_sig";

const target: ScanTarget = {
  supabaseUrl: "https://test.supabase.co",
  anonKey,
};

function extractUrl(input: string | URL | Request): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return (input as Request).url;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("edgeFunctionsAuditModule", () => {
  it("has the correct name", () => {
    expect(edgeFunctionsAuditModule.name).toBe("Edge Functions Audit");
  });

  it("returns no findings when no edge functions are discovered", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response(JSON.stringify({ message: "not found" }), {
        status: 404,
      });
    });

    const result = await edgeFunctionsAuditModule.run(target);

    expect(result.findings).toHaveLength(0);
    expect(result.module).toBe("Edge Functions Audit");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("flags edge function accessible without authentication", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = extractUrl(input as string | URL | Request);

      if (url.includes("/functions/v1/hello")) {
        const headers = (init?.headers ?? {}) as Record<string, string>;
        const hasAuth = headers["Authorization"] || headers["apikey"];

        // Returns 200 whether or not auth is present
        return new Response(JSON.stringify({ message: "Hello!" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({}), { status: 404 });
    });

    const result = await edgeFunctionsAuditModule.run(target);

    expect(
      result.findings.some(
        (f) =>
          f.title.includes("accessible without authentication") &&
          f.severity === "critical",
      ),
    ).toBe(true);
  });

  it("flags wildcard CORS origin on edge function", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = extractUrl(input as string | URL | Request);

      if (url.includes("/functions/v1/webhook")) {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
        });
      }

      return new Response(JSON.stringify({}), { status: 404 });
    });

    const result = await edgeFunctionsAuditModule.run(target);

    expect(
      result.findings.some(
        (f) =>
          f.title.includes("wildcard CORS origin") &&
          f.severity === "high",
      ),
    ).toBe(true);
  });

  it("flags secret leakage in edge function response", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = extractUrl(input as string | URL | Request);

      if (url.includes("/functions/v1/api")) {
        return new Response(
          JSON.stringify({
            error: "Config error",
            debug: "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiJ9.test.sig",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response(JSON.stringify({}), { status: 404 });
    });

    const result = await edgeFunctionsAuditModule.run(target);

    expect(
      result.findings.some(
        (f) =>
          f.title.includes("expose secrets") &&
          f.severity === "critical",
      ),
    ).toBe(true);
  });

  it("flags edge function invocable with anonymous key", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = extractUrl(input as string | URL | Request);

      if (url.includes("/functions/v1/send-email")) {
        const headers = (init?.headers ?? {}) as Record<string, string>;
        const hasAuth = headers["Authorization"] || headers["apikey"];

        if (hasAuth) {
          return new Response(JSON.stringify({ sent: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Without auth, returns 401
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        });
      }

      return new Response(JSON.stringify({}), { status: 404 });
    });

    const result = await edgeFunctionsAuditModule.run(target);

    expect(
      result.findings.some(
        (f) =>
          f.title.includes("invocable with anonymous key") &&
          f.severity === "medium",
      ),
    ).toBe(true);
  });

  it("flags missing rate limiting on edge function", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = extractUrl(input as string | URL | Request);

      if (url.includes("/functions/v1/process-payment")) {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({}), { status: 404 });
    });

    const result = await edgeFunctionsAuditModule.run(target);

    expect(
      result.findings.some(
        (f) =>
          f.title.includes("lack rate limiting") &&
          f.severity === "medium",
      ),
    ).toBe(true);
  });

  it("flags verbose error responses with stack traces", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = extractUrl(input as string | URL | Request);

      if (url.includes("/functions/v1/cron")) {
        return new Response(
          JSON.stringify({
            error: "TypeError: Cannot read property 'id' of undefined",
            stack:
              "at handler (file:///home/deno/functions/cron/index.ts:15:20)",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response(JSON.stringify({}), { status: 404 });
    });

    const result = await edgeFunctionsAuditModule.run(target);

    expect(
      result.findings.some(
        (f) =>
          f.title.includes("exposes internal details") &&
          f.severity === "high",
      ),
    ).toBe(true);
  });

  it("does not flag functions that require authentication", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = extractUrl(input as string | URL | Request);

      if (url.includes("/functions/v1/verify")) {
        return new Response(
          JSON.stringify({ error: "JWT required" }),
          { status: 401 },
        );
      }

      return new Response(JSON.stringify({}), { status: 404 });
    });

    const result = await edgeFunctionsAuditModule.run(target);

    // Should not flag auth bypass, invocation permissions, or rate limiting
    // for functions that properly require authentication
    expect(
      result.findings.some((f) => f.title.includes("verify")),
    ).toBe(false);
  });

  it("returns timing metadata", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 404 }),
    );

    const result = await edgeFunctionsAuditModule.run(target);

    expect(result.module).toBe("Edge Functions Audit");
    expect(result.scannedAt).toBeDefined();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});
