import { describe, it, expect, vi, beforeEach } from "vitest";
import { storageAuditModule } from "../modules/storage-audit";
import type { ScanTarget } from "@/types/scanner";

const target: ScanTarget = {
  supabaseUrl: "https://test.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.fake_sig",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("storageAuditModule", () => {
  it("has the correct name", () => {
    expect(storageAuditModule.name).toBe("Storage Audit");
  });

  it("reports when no buckets are found", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    const result = await storageAuditModule.run(target);

    expect(result.module).toBe("Storage Audit");
    expect(
      result.findings.some((f) => f.title.includes("No storage buckets")),
    ).toBe(true);
  });

  it("flags public buckets", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;

      if (url.includes("/storage/v1/bucket")) {
        return new Response(
          JSON.stringify([
            { id: "avatars", name: "avatars", public: true },
          ]),
          { status: 200 },
        );
      }

      // List objects - blocked
      if (url.includes("/storage/v1/object/list/")) {
        return new Response(JSON.stringify({ message: "forbidden" }), {
          status: 403,
        });
      }

      // Upload test - blocked
      return new Response(JSON.stringify({ message: "forbidden" }), {
        status: 403,
      });
    });

    const result = await storageAuditModule.run(target);

    expect(
      result.findings.some(
        (f) =>
          f.title.includes("marked public") && f.severity === "medium",
      ),
    ).toBe(true);
  });

  it("flags listable buckets with objects", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;

      if (url.includes("/storage/v1/bucket")) {
        return new Response(
          JSON.stringify([
            { id: "docs", name: "docs", public: false },
          ]),
          { status: 200 },
        );
      }

      if (url.includes("/storage/v1/object/list/docs")) {
        return new Response(
          JSON.stringify([
            { name: "secret.pdf", id: "123" },
            { name: "passwords.txt", id: "456" },
          ]),
          { status: 200 },
        );
      }

      return new Response(JSON.stringify({ message: "forbidden" }), {
        status: 403,
      });
    });

    const result = await storageAuditModule.run(target);

    expect(
      result.findings.some(
        (f) => f.title.includes("listable") && f.severity === "high",
      ),
    ).toBe(true);
  });

  it("flags buckets allowing anonymous uploads", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
      const method = init?.method ?? "GET";

      if (url.includes("/storage/v1/bucket") && method === "GET") {
        return new Response(
          JSON.stringify([
            { id: "uploads", name: "uploads", public: false },
          ]),
          { status: 200 },
        );
      }

      if (url.includes("/storage/v1/object/list/")) {
        return new Response(JSON.stringify({ message: "forbidden" }), {
          status: 403,
        });
      }

      if (
        url.includes("/storage/v1/object/uploads/") &&
        method === "POST"
      ) {
        return new Response(JSON.stringify({ Key: "test" }), {
          status: 200,
        });
      }

      if (method === "DELETE") {
        return new Response(null, { status: 200 });
      }

      return new Response(JSON.stringify({ message: "forbidden" }), {
        status: 403,
      });
    });

    const result = await storageAuditModule.run(target);

    expect(
      result.findings.some(
        (f) =>
          f.title.includes("anonymous uploads") &&
          f.severity === "critical",
      ),
    ).toBe(true);
  });
});
