import type { Finding, ScanModule, ScanModuleResult, ScanTarget } from "@/types/scanner";
import { supabaseGet } from "../supabase-client";
import { createFinding } from "../utils";

interface TableInfo {
  readonly name: string;
  readonly schema: string;
}

/**
 * Discover tables via the PostgREST OpenAPI schema endpoint.
 */
async function discoverTables(target: ScanTarget): Promise<readonly TableInfo[]> {
  const response = await supabaseGet(target, "/rest/v1/", {
    headers: { Accept: "application/openapi+json" },
  });

  if (response.status !== 200 || !response.data) {
    return [];
  }

  const spec = response.data as Record<string, unknown>;
  const paths = spec.paths as Record<string, unknown> | undefined;

  if (!paths) return [];

  return Object.keys(paths)
    .filter((p) => p.startsWith("/"))
    .map((p) => ({
      name: p.slice(1),
      schema: "public",
    }));
}

/**
 * Test if a table is readable with the anon key (no RLS or permissive RLS).
 */
async function testTableAccess(
  target: ScanTarget,
  table: TableInfo,
): Promise<Finding | null> {
  const response = await supabaseGet(target, `/rest/v1/${table.name}?limit=1`, {
    headers: { Accept: "application/json" },
  });

  // A 200 with data means the table is publicly readable via anon key
  if (response.status === 200) {
    const data = response.data;
    const hasData = Array.isArray(data) && data.length > 0;
    const isEmpty = Array.isArray(data) && data.length === 0;

    if (hasData) {
      return createFinding({
        title: `Table "${table.name}" is publicly readable with data exposed`,
        description: `The table "${table.name}" returned data when queried with the anonymous key. This means either RLS is disabled or there is a permissive SELECT policy that allows anonymous access. Real user data may be exposed.`,
        severity: "critical",
        category: "rls",
        resource: `${table.schema}.${table.name}`,
        details: {
          table: table.name,
          schema: table.schema,
          rowsReturned: (data as unknown[]).length,
          sampleColumns: Object.keys((data as Record<string, unknown>[])[0] ?? {}),
        },
        remediation: `Enable RLS on the "${table.name}" table and create appropriate SELECT policies. Run: ALTER TABLE ${table.schema}.${table.name} ENABLE ROW LEVEL SECURITY;`,
      });
    }

    if (isEmpty) {
      return createFinding({
        title: `Table "${table.name}" is publicly accessible (empty)`,
        description: `The table "${table.name}" is accessible via the anonymous key but currently contains no data. RLS may be disabled or a permissive policy exists. This is still a risk if data is added later.`,
        severity: "high",
        category: "rls",
        resource: `${table.schema}.${table.name}`,
        details: {
          table: table.name,
          schema: table.schema,
          rowsReturned: 0,
        },
        remediation: `Enable RLS on the "${table.name}" table. Run: ALTER TABLE ${table.schema}.${table.name} ENABLE ROW LEVEL SECURITY;`,
      });
    }
  }

  return null;
}

/**
 * Test if a table allows anonymous INSERT (write without auth).
 */
async function testTableInsert(
  target: ScanTarget,
  table: TableInfo,
): Promise<Finding | null> {
  // We do a dry-run check by sending a HEAD-like request or checking PostgREST OPTIONS
  // For non-destructive testing, we attempt a POST with Prefer: return=minimal and
  // an empty body -- PostgREST will return 400 (bad columns) if INSERT is allowed,
  // or 401/403 if blocked by RLS.
  const url = `${target.supabaseUrl}/rest/v1/${table.name}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: target.anonKey,
      Authorization: `Bearer ${target.anonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({}),
  });

  // 400 = PostgREST accepted the INSERT attempt but columns are wrong
  // This means RLS allows anonymous INSERTs
  // 201 = somehow the insert succeeded (very bad)
  if (response.status === 400 || response.status === 201) {
    const errorBody = await response.text();
    const isColumnError =
      errorBody.includes("column") ||
      errorBody.includes("null value") ||
      errorBody.includes("violates");

    if (response.status === 201 || isColumnError) {
      return createFinding({
        title: `Table "${table.name}" allows anonymous INSERT`,
        description: `The table "${table.name}" accepts write operations from unauthenticated users. An attacker could insert arbitrary data, potentially causing data corruption or abuse.`,
        severity: "critical",
        category: "rls",
        resource: `${table.schema}.${table.name}`,
        details: {
          table: table.name,
          schema: table.schema,
          httpStatus: response.status,
        },
        remediation: `Add a restrictive INSERT policy to "${table.name}" or disable anonymous inserts. Example: CREATE POLICY "deny_anon_insert" ON ${table.schema}.${table.name} FOR INSERT TO anon USING (false);`,
      });
    }
  }

  return null;
}

export const rlsAuditModule: ScanModule = {
  name: "RLS Audit",

  async run(target: ScanTarget): Promise<ScanModuleResult> {
    const start = Date.now();
    const findings: Finding[] = [];

    const tables = await discoverTables(target);

    // Test each table for read and write access
    const readResults = await Promise.all(
      tables.map((t) => testTableAccess(target, t)),
    );

    const writeResults = await Promise.all(
      tables.map((t) => testTableInsert(target, t)),
    );

    for (const finding of [...readResults, ...writeResults]) {
      if (finding) {
        findings.push(finding);
      }
    }

    // If no tables discovered, note it
    if (tables.length === 0) {
      findings.push(
        createFinding({
          title: "No tables discovered via OpenAPI schema",
          description:
            "Could not enumerate tables. The PostgREST OpenAPI endpoint may be disabled or the project URL/key may be incorrect.",
          severity: "low",
          category: "rls",
          resource: "schema",
          details: { tablesFound: 0 },
          remediation: "Verify the Supabase URL and anon key are correct.",
        }),
      );
    }

    return {
      module: "RLS Audit",
      findings,
      scannedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
    };
  },
};
