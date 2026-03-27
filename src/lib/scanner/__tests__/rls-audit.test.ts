import { describe, it, expect, vi, beforeEach } from "vitest";
import { rlsAuditModule } from "../modules/rls-audit";
import type { ScanTarget } from "@/types/scanner";

const target: ScanTarget = {
  supabaseUrl: "https://test.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.fake_sig",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("rlsAuditModule", () => {
  it("has the correct name", () => {
    expect(rlsAuditModule.name).toBe("RLS Audit");
  });

  it("reports when no tables are discovered", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 404 }),
    );

    const result = await rlsAuditModule.run(target);

    expect(result.module).toBe("RLS Audit");
    expect(result.findings.length).toBeGreaterThanOrEqual(1);
    expect(
      result.findings.some((f) => f.title.includes("No tables discovered")),
    ).toBe(true);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("flags tables with publicly readable data", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;

      if (url.includes("/rest/v1/") && !url.includes("?")) {
        return new Response(
          JSON.stringify({
            paths: { "/users": {}, "/posts": {} },
          }),
          { status: 200 },
        );
      }

      if (url.includes("/rest/v1/users?")) {
        return new Response(
          JSON.stringify([{ id: 1, email: "test@test.com" }]),
          { status: 200 },
        );
      }

      if (url.includes("/rest/v1/posts?")) {
        return new Response(JSON.stringify([]), { status: 200 });
      }

      // POST requests (insert tests) - return 403 (RLS blocks)
      return new Response(JSON.stringify({ message: "forbidden" }), {
        status: 403,
      });
    });

    const result = await rlsAuditModule.run(target);

    expect(
      result.findings.some(
        (f) => f.title.includes("users") && f.severity === "critical",
      ),
    ).toBe(true);
    expect(
      result.findings.some(
        (f) => f.title.includes("posts") && f.severity === "high",
      ),
    ).toBe(true);
  });

  it("flags tables that allow anonymous INSERT", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
      const method = init?.method ?? "GET";

      if (url.includes("/rest/v1/") && !url.includes("?") && method === "GET") {
        return new Response(
          JSON.stringify({ paths: { "/orders": {} } }),
          { status: 200 },
        );
      }

      if (url.includes("/rest/v1/orders") && method === "GET") {
        return new Response(JSON.stringify({ message: "forbidden" }), {
          status: 403,
        });
      }

      if (url.includes("/rest/v1/orders") && method === "POST") {
        return new Response(
          JSON.stringify({ message: "null value in column" }),
          { status: 400 },
        );
      }

      return new Response(JSON.stringify({}), { status: 403 });
    });

    const result = await rlsAuditModule.run(target);

    expect(
      result.findings.some(
        (f) =>
          f.title.includes("anonymous INSERT") &&
          f.severity === "critical",
      ),
    ).toBe(true);
  });

  it("returns scan timing metadata", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 403 }),
    );

    const result = await rlsAuditModule.run(target);

    expect(result.scannedAt).toBeDefined();
    expect(new Date(result.scannedAt).getTime()).not.toBeNaN();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});
