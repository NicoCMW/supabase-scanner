export type {
  Severity,
  FindingCategory,
  Finding,
  RemediationSnippet,
  SnippetLanguage,
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

export interface LeaderboardEntry {
  readonly id: string;
  readonly displayName: string;
  readonly grade: import("@supascanner/core").Grade;
  readonly totalFindings: number;
  readonly criticalCount: number;
  readonly highCount: number;
  readonly mediumCount: number;
  readonly lowCount: number;
  readonly scanDate: string;
  readonly shareId: string;
  readonly rank: number;
}

export interface LeaderboardResponse {
  readonly entries: readonly LeaderboardEntry[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly stats: {
    readonly totalEntries: number;
    readonly gradeDistribution: Partial<Record<import("@supascanner/core").Grade, number>>;
  };
}
