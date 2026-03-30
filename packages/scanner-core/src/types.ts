export type Severity = "critical" | "high" | "medium" | "low";

export type FindingCategory = "rls" | "storage" | "auth" | "edge-functions";

export interface Finding {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly severity: Severity;
  readonly category: FindingCategory;
  readonly resource: string;
  readonly details: Record<string, unknown>;
  readonly remediation: string;
}

export interface ScanTarget {
  readonly supabaseUrl: string;
  readonly anonKey: string;
}

export interface ScanModuleResult {
  readonly module: string;
  readonly findings: readonly Finding[];
  readonly scannedAt: string;
  readonly durationMs: number;
}

export interface ScanResult {
  readonly target: ScanTarget;
  readonly modules: readonly ScanModuleResult[];
  readonly grade: Grade;
  readonly totalFindings: number;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly durationMs: number;
}

export type Grade = "A" | "B" | "C" | "D" | "F";

export interface ScanModule {
  readonly name: string;
  run(target: ScanTarget): Promise<ScanModuleResult>;
}
