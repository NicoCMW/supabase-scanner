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
            { id: "avatars", name: "avatars", public: true, file_size_limit: 1048576, allowed_mime_types: ["image/png"] },
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
            { id: "docs", name: "docs", public: false, file_size_limit: null, allowed_mime_types: null },
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
            { id: "uploads", name: "uploads", public: false, file_size_limit: null, allowed_mime_types: null },
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

  it("flags public buckets with sensitive content types", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;

      if (url.includes("/storage/v1/bucket")) {
        return new Response(
          JSON.stringify([
            { id: "public-docs", name: "public-docs", public: true, file_size_limit: null, allowed_mime_types: null },
          ]),
          { status: 200 },
        );
      }

      if (url.includes("/storage/v1/object/list/public-docs")) {
        return new Response(
          JSON.stringify([
            { name: "report.pdf", id: "1", metadata: { mimetype: "application/pdf", size: 50000 } },
            { name: "data.csv", id: "2", metadata: { mimetype: "text/csv", size: 12000 } },
            { name: "avatar.png", id: "3", metadata: { mimetype: "image/png", size: 8000 } },
          ]),
          { status: 200 },
        );
      }

      return new Response(JSON.stringify({ message: "forbidden" }), {
        status: 403,
      });
    });

    const result = await storageAuditModule.run(target);

    const finding = result.findings.find((f) =>
      f.title.includes("sensitive file types"),
    );
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("high");
    expect(finding!.details.sensitiveFileCount).toBe(2);
  });

  it("flags storage.objects table accessible via REST", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;

      if (url.includes("/rest/v1/objects")) {
        return new Response(
          JSON.stringify([{ id: "abc-123" }]),
          { status: 200 },
        );
      }

      if (url.includes("/storage/v1/bucket")) {
        return new Response(JSON.stringify([]), { status: 200 });
      }

      return new Response(JSON.stringify({ message: "forbidden" }), {
        status: 403,
      });
    });

    const result = await storageAuditModule.run(target);

    const finding = result.findings.find((f) =>
      f.title.includes("storage.objects table is accessible"),
    );
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("critical");
  });

  it("flags buckets with no file size limit", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;

      if (url.includes("/storage/v1/bucket")) {
        return new Response(
          JSON.stringify([
            { id: "data", name: "data", public: false, file_size_limit: null, allowed_mime_types: ["image/png"] },
          ]),
          { status: 200 },
        );
      }

      return new Response(JSON.stringify({ message: "forbidden" }), {
        status: 403,
      });
    });

    const result = await storageAuditModule.run(target);

    const finding = result.findings.find((f) =>
      f.title.includes("no file size limit"),
    );
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("medium");
    // Should NOT have a MIME type restriction finding since allowed_mime_types is set
    expect(
      result.findings.some((f) => f.title.includes("no MIME type restrictions")),
    ).toBe(false);
  });

  it("flags buckets with no MIME type restrictions", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;

      if (url.includes("/storage/v1/bucket")) {
        return new Response(
          JSON.stringify([
            { id: "media", name: "media", public: false, file_size_limit: 5242880, allowed_mime_types: null },
          ]),
          { status: 200 },
        );
      }

      return new Response(JSON.stringify({ message: "forbidden" }), {
        status: 403,
      });
    });

    const result = await storageAuditModule.run(target);

    const finding = result.findings.find((f) =>
      f.title.includes("no MIME type restrictions"),
    );
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("medium");
    // Should NOT have a file size limit finding since file_size_limit is set
    expect(
      result.findings.some((f) => f.title.includes("no file size limit")),
    ).toBe(false);
  });

  it("flags buckets allowing anonymous deletes", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
      const method = init?.method ?? "GET";

      if (url.includes("/storage/v1/bucket") && method === "GET") {
        return new Response(
          JSON.stringify([
            { id: "files", name: "files", public: false, file_size_limit: 1048576, allowed_mime_types: ["image/png"] },
          ]),
          { status: 200 },
        );
      }

      if (url.includes("delete-probe") && method === "DELETE") {
        return new Response(JSON.stringify({ message: "deleted" }), {
          status: 200,
        });
      }

      return new Response(JSON.stringify({ message: "forbidden" }), {
        status: 403,
      });
    });

    const result = await storageAuditModule.run(target);

    const finding = result.findings.find((f) =>
      f.title.includes("anonymous deletes"),
    );
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("critical");
  });

  it("flags buckets allowing anonymous signed URL creation", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
      const method = init?.method ?? "GET";

      if (url.includes("/storage/v1/bucket") && method === "GET") {
        return new Response(
          JSON.stringify([
            { id: "private-data", name: "private-data", public: false, file_size_limit: 1048576, allowed_mime_types: ["image/png"] },
          ]),
          { status: 200 },
        );
      }

      if (url.includes("/storage/v1/object/sign/") && method === "POST") {
        return new Response(
          JSON.stringify({ signedURL: "https://test.supabase.co/storage/v1/object/sign/private-data/test?token=abc" }),
          { status: 200 },
        );
      }

      return new Response(JSON.stringify({ message: "forbidden" }), {
        status: 403,
      });
    });

    const result = await storageAuditModule.run(target);

    const finding = result.findings.find((f) =>
      f.title.includes("signed URL creation"),
    );
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("high");
  });

  it("does not flag well-configured buckets for restrictions", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;

      if (url.includes("/storage/v1/bucket")) {
        return new Response(
          JSON.stringify([
            {
              id: "secure",
              name: "secure",
              public: false,
              file_size_limit: 5242880,
              allowed_mime_types: ["image/png", "image/jpeg"],
            },
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
      result.findings.some((f) => f.title.includes("no file size limit")),
    ).toBe(false);
    expect(
      result.findings.some((f) => f.title.includes("no MIME type")),
    ).toBe(false);
    expect(
      result.findings.some((f) => f.title.includes("marked public")),
    ).toBe(false);
  });
});
