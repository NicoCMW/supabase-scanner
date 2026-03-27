import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getOrCreatePreferences,
  getPreferencesByToken,
  updatePreferencesByToken,
  updatePreferences,
  buildUnsubscribeUrl,
} from "../preferences";

function createMockClient(overrides: Record<string, unknown> = {}) {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  return {
    from: vi.fn().mockReturnValue(chainable),
    _chain: chainable,
  } as unknown;
}

const defaultPrefs = {
  id: "pref-1",
  user_id: "user-1",
  welcome_email: true,
  scan_results_email: true,
  weekly_digest_email: true,
  unsubscribe_token: "abc123token",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("buildUnsubscribeUrl", () => {
  it("builds URL with token query parameter", () => {
    const url = buildUnsubscribeUrl("my-token-123");
    expect(url).toContain("/api/email/unsubscribe");
    expect(url).toContain("token=my-token-123");
  });

  it("encodes special characters in token", () => {
    const url = buildUnsubscribeUrl("tok&en=value");
    expect(url).toContain("token=tok%26en%3Dvalue");
  });
});

describe("getOrCreatePreferences", () => {
  it("returns existing preferences when found", async () => {
    const client = createMockClient({
      single: vi.fn().mockResolvedValue({ data: defaultPrefs, error: null }),
    });

    const result = await getOrCreatePreferences(client as any, "user-1");

    expect(result).toEqual(defaultPrefs);
  });

  it("creates preferences when none exist", async () => {
    let callCount = 0;
    const client = createMockClient({
      single: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: defaultPrefs, error: null });
      }),
    });

    const result = await getOrCreatePreferences(client as any, "user-1");

    expect(result).toEqual(defaultPrefs);
  });

  it("throws when creation fails", async () => {
    let callCount = 0;
    const client = createMockClient({
      single: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({
          data: null,
          error: { message: "insert failed" },
        });
      }),
    });

    await expect(
      getOrCreatePreferences(client as any, "user-1"),
    ).rejects.toThrow("Failed to create email preferences");
  });
});

describe("getPreferencesByToken", () => {
  it("returns preferences when token matches", async () => {
    const client = createMockClient({
      single: vi.fn().mockResolvedValue({ data: defaultPrefs, error: null }),
    });

    const result = await getPreferencesByToken(client as any, "abc123token");

    expect(result).toEqual(defaultPrefs);
  });

  it("returns null when token not found", async () => {
    const client = createMockClient({
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const result = await getPreferencesByToken(client as any, "bad-token");

    expect(result).toBeNull();
  });
});

describe("updatePreferencesByToken", () => {
  it("updates and returns preferences", async () => {
    const updated = { ...defaultPrefs, scan_results_email: false };
    const client = createMockClient({
      single: vi.fn().mockResolvedValue({ data: updated, error: null }),
    });

    const result = await updatePreferencesByToken(client as any, "abc123token", {
      scan_results_email: false,
    });

    expect(result?.scan_results_email).toBe(false);
  });

  it("returns null on error", async () => {
    const client = createMockClient({
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "not found" },
      }),
    });

    const result = await updatePreferencesByToken(client as any, "bad-token", {
      scan_results_email: false,
    });

    expect(result).toBeNull();
  });
});

describe("updatePreferences", () => {
  it("updates preferences for authenticated user", async () => {
    const updated = { ...defaultPrefs, weekly_digest_email: false };
    const client = createMockClient({
      single: vi.fn().mockResolvedValue({ data: updated, error: null }),
    });

    const result = await updatePreferences(client as any, "user-1", {
      weekly_digest_email: false,
    });

    expect(result?.weekly_digest_email).toBe(false);
  });

  it("returns null on error", async () => {
    const client = createMockClient({
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "update failed" },
      }),
    });

    const result = await updatePreferences(client as any, "user-1", {
      welcome_email: false,
    });

    expect(result).toBeNull();
  });
});
