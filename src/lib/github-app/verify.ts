import { createHmac, timingSafeEqual } from "crypto";

function getWebhookSecret(): string {
  const secret = process.env.GITHUB_APP_WEBHOOK_SECRET;
  if (!secret) throw new Error("GITHUB_APP_WEBHOOK_SECRET is required");
  return secret;
}

/**
 * Verify a GitHub webhook signature (HMAC-SHA256).
 * Returns true if the signature is valid.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | null,
): boolean {
  if (!signature) return false;

  const secret = getWebhookSecret();
  const expected =
    "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");

  if (signature.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
