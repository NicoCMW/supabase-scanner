import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();

vi.mock("../client", () => ({
  resend: {
    emails: {
      send: (...args: unknown[]) => mockSend(...args),
    },
  },
  EMAIL_FROM: "SupaScanner <noreply@supascanner.com>",
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

import {
  sendWelcomeEmail,
  sendScanResultsEmail,
  sendWeeklyDigestEmail,
} from "../send";

beforeEach(() => {
  mockSend.mockReset();
});

describe("sendScanResultsEmail", () => {
  const defaultProps = {
    userName: "alice",
    grade: "B" as const,
    totalFindings: 5,
    criticalCount: 0,
    highCount: 1,
    mediumCount: 2,
    lowCount: 2,
    scanUrl: "https://supascanner.com/scan/abc-123",
    unsubscribeUrl: "https://supascanner.com/api/email/unsubscribe?token=tok",
  };

  it("sends email via resend and returns success", async () => {
    mockSend.mockResolvedValue({ data: { id: "email-id-1" }, error: null });

    const result = await sendScanResultsEmail("alice@example.com", defaultProps);

    expect(result).toEqual({ success: true, id: "email-id-1" });
    expect(mockSend).toHaveBeenCalledOnce();

    const call = mockSend.mock.calls[0][0];
    expect(call.from).toBe("SupaScanner <noreply@supascanner.com>");
    expect(call.to).toBe("alice@example.com");
    expect(call.subject).toContain("Grade B");
    expect(call.subject).toContain("5 Findings");
  });

  it("returns failure when resend returns an error object", async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { message: "Invalid API key" },
    });

    const result = await sendScanResultsEmail("bob@example.com", defaultProps);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid API key");
  });

  it("returns failure when resend throws", async () => {
    mockSend.mockRejectedValue(new Error("Network timeout"));

    const result = await sendScanResultsEmail("bob@example.com", defaultProps);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Network timeout");
  });

  it("uses singular 'Finding' for exactly 1 finding", async () => {
    mockSend.mockResolvedValue({ data: { id: "e-2" }, error: null });

    await sendScanResultsEmail("x@y.com", {
      ...defaultProps,
      totalFindings: 1,
    });

    const subject = mockSend.mock.calls[0][0].subject;
    expect(subject).toContain("1 Finding");
    expect(subject).not.toContain("1 Findings");
  });
});

describe("sendWelcomeEmail", () => {
  it("sends welcome email successfully", async () => {
    mockSend.mockResolvedValue({ data: { id: "w-1" }, error: null });

    const result = await sendWelcomeEmail("new@user.com", {
      userName: "newuser",
      unsubscribeUrl: "https://supascanner.com/api/email/unsubscribe?token=t",
    });

    expect(result).toEqual({ success: true, id: "w-1" });
    expect(mockSend.mock.calls[0][0].subject).toContain("Welcome");
  });
});

describe("sendWeeklyDigestEmail", () => {
  it("sends digest email successfully", async () => {
    mockSend.mockResolvedValue({ data: { id: "d-1" }, error: null });

    const result = await sendWeeklyDigestEmail("user@test.com", {
      userName: "user",
      totalScans: 3,
      averageGrade: "B",
      newFindings: 7,
      resolvedFindings: 2,
      topFindings: [
        { title: "No RLS on users", severity: "critical", category: "rls" },
      ],
      dashboardUrl: "https://supascanner.com/dashboard",
      unsubscribeUrl: "https://supascanner.com/api/email/unsubscribe?token=t2",
    });

    expect(result).toEqual({ success: true, id: "d-1" });
    const subject = mockSend.mock.calls[0][0].subject;
    expect(subject).toContain("3 Scans");
    expect(subject).toContain("Avg Grade B");
  });
});
