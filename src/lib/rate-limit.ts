import { NextResponse } from "next/server";
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

export function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429 },
  );
}
