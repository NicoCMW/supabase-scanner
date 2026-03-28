export type {
  Severity,
  FindingCategory,
  Finding,
  ScanTarget,
  ScanModuleResult,
  ScanResult,
  Grade,
  ScanModule,
} from "@supascanner/core";

export interface SharedResult {
  readonly id: string;
  readonly shareId: string;
  readonly grade: import("@supascanner/core").Grade;
  readonly scanDate: string;
  readonly criticalCount: number;
  readonly highCount: number;
  readonly mediumCount: number;
  readonly lowCount: number;
  readonly totalFindings: number;
  readonly createdAt: string;
}
