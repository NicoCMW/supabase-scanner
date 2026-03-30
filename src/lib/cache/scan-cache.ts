import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScanModuleResult, Grade, Finding } from "@/types/scanner";

/** Cache TTL in seconds per plan tier */
export const CACHE_TTL: Record<string, number> = {
  free: 3600, // 1 hour
  pro: 900, // 15 minutes
};

export interface CachedScanResult {
  readonly scanJobId: string;
  readonly grade: Grade;
  readonly totalFindings: number;
  readonly modules: readonly ScanModuleResult[];
  readonly durationMs: number;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly cached: true;
  readonly cachedAt: string;
  readonly cacheAgeSeconds: number;
}

interface FindingRow {
  readonly title: string;
  readonly description: string;
  readonly severity: string;
  readonly category: string;
  readonly resource: string;
  readonly details: Record<string, unknown>;
  readonly remediation: string;
  readonly module: string;
  readonly id: string;
}

function getCacheTtlSeconds(plan: string): number {
  return CACHE_TTL[plan] ?? CACHE_TTL.free;
}

/**
 * Check for a recent completed scan of the same URL within the cache TTL.
 * Returns the cached result if found, or null if a fresh scan is needed.
 */
export async function getCachedScan(
  supabase: SupabaseClient,
  supabaseUrl: string,
  plan: string,
): Promise<CachedScanResult | null> {
  const ttlSeconds = getCacheTtlSeconds(plan);
  const cutoff = new Date(Date.now() - ttlSeconds * 1000).toISOString();

  const { data: scanJob } = await supabase
    .from("scan_jobs")
    .select("id, grade, total_findings, duration_ms, created_at, completed_at")
    .eq("supabase_url", supabaseUrl)
    .eq("status", "completed")
    .gte("completed_at", cutoff)
    .order("completed_at", { ascending: false })
    .limit(1)
    .single();

  if (!scanJob) {
    return null;
  }

  const { data: findings } = await supabase
    .from("findings")
    .select("id, title, description, severity, category, resource, details, remediation, module")
    .eq("scan_job_id", scanJob.id)
    .order("severity", { ascending: true });

  const findingRows: readonly FindingRow[] = findings ?? [];

  const moduleMap = new Map<string, Finding[]>();
  for (const f of findingRows) {
    const list = moduleMap.get(f.module) ?? [];
    list.push({
      id: f.id,
      title: f.title,
      description: f.description,
      severity: f.severity as Finding["severity"],
      category: f.category as Finding["category"],
      resource: f.resource,
      details: f.details,
      remediation: f.remediation,
    });
    moduleMap.set(f.module, list);
  }

  const modules: ScanModuleResult[] = [...moduleMap.entries()].map(
    ([module, moduleFindings]) => ({
      module,
      findings: moduleFindings,
      scannedAt: scanJob.completed_at,
      durationMs: 0,
    }),
  );

  const completedAt = scanJob.completed_at ?? scanJob.created_at;
  const cacheAgeSeconds = Math.round(
    (Date.now() - new Date(completedAt).getTime()) / 1000,
  );

  return {
    scanJobId: scanJob.id,
    grade: scanJob.grade as Grade,
    totalFindings: scanJob.total_findings,
    modules,
    durationMs: scanJob.duration_ms ?? 0,
    startedAt: scanJob.created_at,
    completedAt,
    cached: true,
    cachedAt: completedAt,
    cacheAgeSeconds,
  };
}

/**
 * Record a cache event for metrics tracking.
 * Uses the existing rate_limit_events table pattern with a daily window.
 */
export async function recordCacheEvent(
  adminClient: SupabaseClient,
  hit: boolean,
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const key = `cache:${hit ? "hit" : "miss"}:${today}`;

  await adminClient.rpc("check_rate_limit", {
    p_key: key,
    p_window_seconds: 86400,
    p_max_requests: 999999999,
  });
}
