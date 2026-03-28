import type { ScanModule, ScanResult, ScanTarget } from "./types.js";
import { rlsAuditModule } from "./modules/rls-audit.js";
import { storageAuditModule } from "./modules/storage-audit.js";
import { authAuditModule } from "./modules/auth-audit.js";
import { computeGrade } from "./utils.js";
import { validateTarget } from "./supabase-client.js";

const DEFAULT_MODULES: readonly ScanModule[] = [
  rlsAuditModule,
  storageAuditModule,
  authAuditModule,
];

export async function runScan(
  target: ScanTarget,
  modules: readonly ScanModule[] = DEFAULT_MODULES,
): Promise<ScanResult> {
  const validation = validateTarget(target);
  if (!validation.valid) {
    throw new Error(
      `Invalid scan target: ${validation.errors.join(", ")}`,
    );
  }

  const startedAt = new Date().toISOString();
  const start = Date.now();

  const moduleResults = await Promise.all(
    modules.map((m) => m.run(target)),
  );

  const allFindings = moduleResults.flatMap((r) => r.findings);

  return {
    target,
    modules: moduleResults,
    grade: computeGrade(allFindings),
    totalFindings: allFindings.length,
    startedAt,
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - start,
  };
}

export { validateTarget } from "./supabase-client.js";
export { computeGrade, createFinding } from "./utils.js";
export { rlsAuditModule } from "./modules/rls-audit.js";
export { storageAuditModule } from "./modules/storage-audit.js";
export { authAuditModule } from "./modules/auth-audit.js";
export type {
  Finding,
  FindingCategory,
  Grade,
  ScanModule,
  ScanModuleResult,
  ScanResult,
  ScanTarget,
  Severity,
} from "./types.js";
export type { SupabaseHttpResponse } from "./supabase-client.js";
