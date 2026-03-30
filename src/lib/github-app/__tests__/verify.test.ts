import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "crypto";
import { verifyWebhookSignature } from "../verify";

const TEST_SECRET = "test-webhook-secret-1234";

beforeEach(() => {
  vi.stubEnv("GITHUB_APP_WEBHOOK_SECRET", TEST_SECRET);
});

function sign(payload: string): string {
  return (
    "sha256=" + createHmac("sha256", TEST_SECRET).update(payload).digest("hex")
  );
}

describe("verifyWebhookSignature", () => {
  it("returns true for a valid signature", () => {
    const payload = '{"action":"opened"}';
    const signature = sign(payload);
    expect(verifyWebhookSignature(payload, signature)).toBe(true);
  });

  it("returns false for null signature", () => {
    expect(verifyWebhookSignature("body", null)).toBe(false);
  });

  it("returns false for empty signature", () => {
    expect(verifyWebhookSignature("body", "")).toBe(false);
  });

  it("returns false for invalid signature", () => {
    const payload = '{"action":"opened"}';
    expect(verifyWebhookSignature(payload, "sha256=invalid")).toBe(false);
  });

  it("returns false for tampered payload", () => {
    const payload = '{"action":"opened"}';
    const signature = sign(payload);
    expect(verifyWebhookSignature('{"action":"closed"}', signature)).toBe(
      false,
    );
  });
});
