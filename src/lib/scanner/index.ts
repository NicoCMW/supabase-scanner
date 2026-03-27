import type { ScanModule, ScanResult, ScanTarget } from "@/types/scanner";
import { rlsAuditModule } from "./modules/rls-audit";
import { storageAuditModule } from "./modules/storage-audit";
import { authAuditModule } from "./modules/auth-audit";
import { computeGrade } from "./utils";
import { validateTarget } from "./supabase-client";

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

export { validateTarget } from "./supabase-client";
export { computeGrade } from "./utils";
export { rlsAuditModule } from "./modules/rls-audit";
export { storageAuditModule } from "./modules/storage-audit";
export { authAuditModule } from "./modules/auth-audit";
