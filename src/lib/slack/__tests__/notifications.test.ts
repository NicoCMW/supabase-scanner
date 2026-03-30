import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

import {
  notifySlackOnScanComplete,
  sendSlackTestMessage,
} from "../notifications";

function createMockSupabase(webhooks: readonly Record<string, unknown>[]) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: webhooks, error: null }),
        }),
      }),
    }),
  } as never;
}

const defaultPayload = {
  grade: "B" as const,
  totalFindings: 5,
  criticalCount: 0,
  highCount: 1,
  mediumCount: 2,
  lowCount: 2,
  scanUrl: "https://supabase-scanner.vercel.app/scan/abc-123",
  supabaseUrl: "https://myproject.supabase.co",
  durationMs: 3200,
};

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({ ok: true });
});

describe("notifySlackOnScanComplete", () => {
  it("sends notification to all enabled webhooks", async () => {
    const webhooks = [
      {
        id: "w1",
        webhook_url: "https://hooks.slack.com/services/T1/B1/abc",
        enabled: true,
        notify_scan_complete: true,
        notify_critical_finding: false,
        notify_score_degradation: false,
      },
      {
        id: "w2",
        webhook_url: "https://hooks.slack.com/services/T1/B2/def",
        enabled: true,
        notify_scan_complete: true,
        notify_critical_finding: false,
        notify_score_degradation: false,
      },
    ];

    const client = createMockSupabase(webhooks);
    await notifySlackOnScanComplete(client, "user-1", defaultPayload);

    // Allow fire-and-forget promises to settle
    await new Promise((r) => setTimeout(r, 10));

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("skips webhooks that do not match any notification trigger", async () => {
    const webhooks = [
      {
        id: "w1",
        webhook_url: "https://hooks.slack.com/services/T1/B1/abc",
        enabled: true,
        notify_scan_complete: false,
        notify_critical_finding: false,
        notify_score_degradation: false,
      },
    ];

    const client = createMockSupabase(webhooks);
    await notifySlackOnScanComplete(client, "user-1", defaultPayload);

    await new Promise((r) => setTimeout(r, 10));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends to webhook with notify_critical_finding when criticals found", async () => {
    const webhooks = [
      {
        id: "w1",
        webhook_url: "https://hooks.slack.com/services/T1/B1/abc",
        enabled: true,
        notify_scan_complete: false,
        notify_critical_finding: true,
        notify_score_degradation: false,
      },
    ];

    const client = createMockSupabase(webhooks);
    await notifySlackOnScanComplete(client, "user-1", {
      ...defaultPayload,
      criticalCount: 2,
    });

    await new Promise((r) => setTimeout(r, 10));
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("sends to webhook with notify_score_degradation when grade drops", async () => {
    const webhooks = [
      {
        id: "w1",
        webhook_url: "https://hooks.slack.com/services/T1/B1/abc",
        enabled: true,
        notify_scan_complete: false,
        notify_critical_finding: false,
        notify_score_degradation: true,
      },
    ];

    const client = createMockSupabase(webhooks);
    await notifySlackOnScanComplete(client, "user-1", {
      ...defaultPayload,
      grade: "D" as const,
      previousGrade: "B" as const,
    });

    await new Promise((r) => setTimeout(r, 10));
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("does not send on score improvement (only degradation)", async () => {
    const webhooks = [
      {
        id: "w1",
        webhook_url: "https://hooks.slack.com/services/T1/B1/abc",
        enabled: true,
        notify_scan_complete: false,
        notify_critical_finding: false,
        notify_score_degradation: true,
      },
    ];

    const client = createMockSupabase(webhooks);
    await notifySlackOnScanComplete(client, "user-1", {
      ...defaultPayload,
      grade: "A" as const,
      previousGrade: "C" as const,
    });

    await new Promise((r) => setTimeout(r, 10));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does nothing when no webhooks exist", async () => {
    const client = createMockSupabase([]);
    await notifySlackOnScanComplete(client, "user-1", defaultPayload);

    await new Promise((r) => setTimeout(r, 10));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends Block Kit formatted payload", async () => {
    const webhooks = [
      {
        id: "w1",
        webhook_url: "https://hooks.slack.com/services/T1/B1/abc",
        enabled: true,
        notify_scan_complete: true,
        notify_critical_finding: false,
        notify_score_degradation: false,
      },
    ];

    const client = createMockSupabase(webhooks);
    await notifySlackOnScanComplete(client, "user-1", defaultPayload);

    await new Promise((r) => setTimeout(r, 10));

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://hooks.slack.com/services/T1/B1/abc");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body);
    expect(body.text).toContain("Grade B");
    expect(body.blocks).toBeDefined();
    expect(body.blocks.length).toBeGreaterThan(0);
    expect(body.blocks[0].type).toBe("header");
  });
});

describe("sendSlackTestMessage", () => {
  it("sends test message and returns true on success", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const result = await sendSlackTestMessage(
      "https://hooks.slack.com/services/T1/B1/abc",
    );

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledOnce();

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toContain("test");
  });

  it("returns false when Slack responds with error", async () => {
    mockFetch.mockResolvedValue({ ok: false });

    const result = await sendSlackTestMessage(
      "https://hooks.slack.com/services/T1/B1/bad",
    );

    expect(result).toBe(false);
  });

  it("returns false when fetch throws", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const result = await sendSlackTestMessage(
      "https://hooks.slack.com/services/T1/B1/bad",
    );

    expect(result).toBe(false);
  });
});
