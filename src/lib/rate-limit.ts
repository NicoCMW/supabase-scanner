import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

interface RateLimitConfig {
  readonly windowSeconds: number;
  readonly maxRequests: number;
}

export const RATE_LIMITS = {
  billing: { windowSeconds: 60, maxRequests: 10 } as const,
  scan: { windowSeconds: 60, maxRequests: 5 } as const,
  widget: { windowSeconds: 60, maxRequests: 60 } as const,
} as const;

// Tiered scan rate limits: per-IP (hourly) and per-project (daily)
export const SCAN_RATE_LIMITS = {
  free: {
    perIp: { windowSeconds: 3600, maxRequests: 5 } as const,
    perProject: { windowSeconds: 86400, maxRequests: 10 } as const,
  },
  pro: {
    perIp: { windowSeconds: 3600, maxRequests: 50 } as const,
    perProject: { windowSeconds: 86400, maxRequests: 50 } as const,
  },
} as const;

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  key: string,
  config: RateLimitConfig,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_window_seconds: config.windowSeconds,
    p_max_requests: config.maxRequests,
  });

  if (error) {
    // Fail open: if rate limit check fails, allow the request
    // but this should be monitored
    return true;
  }

  return data as boolean;
}

export async function checkScanRateLimits(
  supabase: SupabaseClient,
  request: NextRequest,
  userId: string,
  plan: string,
): Promise<{ allowed: boolean; limitName?: string; retryAfterSeconds?: number }> {
  const tier = plan === "pro" ? SCAN_RATE_LIMITS.pro : SCAN_RATE_LIMITS.free;

  // Per-user burst protection (existing behavior)
  const burstAllowed = await checkRateLimit(
    supabase,
    `scan:${userId}`,
    RATE_LIMITS.scan,
  );
  if (!burstAllowed) {
    logRateLimitHit("scan:burst", userId, plan, request);
    return { allowed: false, limitName: "burst", retryAfterSeconds: 60 };
  }

  // Per-IP hourly limit
  const ip = getClientIp(request);
  const ipAllowed = await checkRateLimit(
    supabase,
    `scan:ip:${ip}`,
    tier.perIp,
  );
  if (!ipAllowed) {
    logRateLimitHit("scan:ip", userId, plan, request, ip);
    return { allowed: false, limitName: "ip", retryAfterSeconds: tier.perIp.windowSeconds };
  }

  return { allowed: true };
}

export async function checkProjectRateLimit(
  supabase: SupabaseClient,
  request: NextRequest,
  userId: string,
  plan: string,
  supabaseUrl: string,
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const tier = plan === "pro" ? SCAN_RATE_LIMITS.pro : SCAN_RATE_LIMITS.free;
  const normalizedUrl = supabaseUrl.replace(/\/+$/, "").toLowerCase();

  const projectAllowed = await checkRateLimit(
    supabase,
    `scan:project:${normalizedUrl}`,
    tier.perProject,
  );
  if (!projectAllowed) {
    logRateLimitHit("scan:project", userId, plan, request, getClientIp(request), normalizedUrl);
    return { allowed: false, retryAfterSeconds: tier.perProject.windowSeconds };
  }

  return { allowed: true };
}

function logRateLimitHit(
  limitType: string,
  userId: string,
  plan: string,
  request: NextRequest,
  ip?: string,
  project?: string,
): void {
  Sentry.captureMessage(`Rate limit hit: ${limitType}`, {
    level: "warning",
    tags: { limitType, plan },
    extra: {
      userId,
      ip: ip ?? getClientIp(request),
      project,
      path: request.nextUrl.pathname,
    },
  });
}

export function rateLimitResponse(retryAfterSeconds?: number): NextResponse {
  const headers: Record<string, string> = {};
  if (retryAfterSeconds) {
    headers["Retry-After"] = String(retryAfterSeconds);
  }

  return NextResponse.json(
    {
      error: "Too many requests. Please try again later.",
      retryAfterSeconds: retryAfterSeconds ?? 60,
    },
    { status: 429, headers },
  );
}
