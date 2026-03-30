import { SignJWT, importPKCS8 } from "jose";

interface InstallationToken {
  readonly token: string;
  readonly expiresAt: number;
}

const tokenCache = new Map<number, InstallationToken>();

function getAppId(): string {
  const id = process.env.GITHUB_APP_ID;
  if (!id) throw new Error("GITHUB_APP_ID is required");
  return id;
}

function getPrivateKey(): string {
  const key = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!key) throw new Error("GITHUB_APP_PRIVATE_KEY is required");
  // Support base64-encoded PEM (for env vars that can't hold newlines)
  if (!key.includes("-----BEGIN")) {
    return Buffer.from(key, "base64").toString("utf8");
  }
  return key;
}

export function isGitHubAppConfigured(): boolean {
  return !!(
    process.env.GITHUB_APP_ID &&
    process.env.GITHUB_APP_PRIVATE_KEY &&
    process.env.GITHUB_APP_WEBHOOK_SECRET
  );
}

/**
 * Generate a JWT for authenticating as the GitHub App.
 * Valid for 10 minutes per GitHub's requirements.
 */
export async function createAppJwt(): Promise<string> {
  const appId = getAppId();
  const pem = getPrivateKey();
  const privateKey = await importPKCS8(pem, "RS256");

  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt(now - 60) // 60s clock drift allowance
    .setExpirationTime(now + 600) // 10 minutes
    .setIssuer(appId)
    .sign(privateKey);
}

/**
 * Get an installation access token for a specific GitHub App installation.
 * Caches tokens until 5 minutes before expiry.
 */
export async function getInstallationToken(
  installationId: number,
): Promise<string> {
  const cached = tokenCache.get(installationId);
  const now = Date.now();

  // Return cached token if valid for at least 5 more minutes
  if (cached && cached.expiresAt - now > 5 * 60 * 1000) {
    return cached.token;
  }

  const jwt = await createAppJwt();
  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to get installation token (${response.status}): ${body}`,
    );
  }

  const data = (await response.json()) as {
    token: string;
    expires_at: string;
  };

  tokenCache.set(installationId, {
    token: data.token,
    expiresAt: new Date(data.expires_at).getTime(),
  });

  return data.token;
}
