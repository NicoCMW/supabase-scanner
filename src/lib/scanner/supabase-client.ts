import type { ScanTarget } from "@/types/scanner";

export interface SupabaseHttpResponse {
  readonly status: number;
  readonly statusText: string;
  readonly data: unknown;
  readonly headers: Record<string, string>;
}

/**
 * Thin HTTP abstraction for Supabase REST API calls.
 * Uses only the anon key -- never service_role.
 * All requests are read-only by design (non-destructive scanning).
 */
export async function supabaseGet(
  target: ScanTarget,
  path: string,
  options: { headers?: Record<string, string> } = {},
): Promise<SupabaseHttpResponse> {
  const url = `${target.supabaseUrl}${path}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: target.anonKey,
      Authorization: `Bearer ${target.anonKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return {
    status: response.status,
    statusText: response.statusText,
    data,
    headers: responseHeaders,
  };
}

export async function supabasePost(
  target: ScanTarget,
  path: string,
  body: unknown,
  options: { headers?: Record<string, string> } = {},
): Promise<SupabaseHttpResponse> {
  const url = `${target.supabaseUrl}${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: target.anonKey,
      Authorization: `Bearer ${target.anonKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: JSON.stringify(body),
  });

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return {
    status: response.status,
    statusText: response.statusText,
    data,
    headers: responseHeaders,
  };
}

/**
 * Validate that a Supabase URL and anon key appear structurally valid.
 */
export function validateTarget(target: ScanTarget): {
  readonly valid: boolean;
  readonly errors: readonly string[];
} {
  const errors: string[] = [];

  try {
    const url = new URL(target.supabaseUrl);
    if (!url.hostname.endsWith(".supabase.co") && !url.hostname.includes("localhost")) {
      errors.push("URL does not appear to be a Supabase project URL");
    }
    if (url.protocol !== "https:" && !url.hostname.includes("localhost")) {
      errors.push("Supabase URL must use HTTPS");
    }
  } catch {
    errors.push("Invalid URL format");
  }

  if (!target.anonKey || target.anonKey.length < 30) {
    errors.push("Anon key appears too short to be valid");
  }

  // Basic JWT structure check (three dot-separated parts)
  const parts = target.anonKey.split(".");
  if (parts.length !== 3) {
    errors.push("Anon key does not appear to be a valid JWT");
  }

  return { valid: errors.length === 0, errors };
}
