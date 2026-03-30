import type { Finding, ScanModule, ScanModuleResult, ScanTarget } from "../types";
import { supabaseGet } from "../supabase-client";
import { createFinding } from "../utils";

interface TableInfo {
  readonly name: string;
  readonly schema: string;
}

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

async function testTableAccess(
  target: ScanTarget,
  table: TableInfo,
): Promise<Finding | null> {
  const response = await supabaseGet(target, `/rest/v1/${table.name}?limit=1`, {
    headers: { Accept: "application/json" },
  });

  if (response.status === 200) {
    const data = response.data;
    const hasData = Array.isArray(data) && data.length > 0;
    const isEmpty = Array.isArray(data) && data.length === 0;

    if (hasData) {
      const columns = Object.keys((data as Record<string, unknown>[])[0] ?? {});
      const hasIdColumn = columns.includes("id");
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
          sampleColumns: columns,
        },
        remediation: `Enable RLS on the "${table.name}" table and create appropriate SELECT policies. Run: ALTER TABLE ${table.schema}.${table.name} ENABLE ROW LEVEL SECURITY;`,
        remediationSnippets: [
          {
            label: "Enable Row Level Security",
            language: "sql",
            code: `ALTER TABLE ${table.schema}.${table.name} ENABLE ROW LEVEL SECURITY;`,
          },
          {
            label: "Allow authenticated users to read own rows",
            language: "sql",
            code: hasIdColumn
              ? `CREATE POLICY "${table.name}_select_own"\n  ON ${table.schema}.${table.name}\n  FOR SELECT\n  TO authenticated\n  USING (auth.uid() = id);`
              : `CREATE POLICY "${table.name}_select_authenticated"\n  ON ${table.schema}.${table.name}\n  FOR SELECT\n  TO authenticated\n  USING (true);`,
          },
          {
            label: "Block anonymous access completely",
            language: "sql",
            code: `CREATE POLICY "${table.name}_deny_anon"\n  ON ${table.schema}.${table.name}\n  FOR ALL\n  TO anon\n  USING (false);`,
          },
        ],
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
        remediationSnippets: [
          {
            label: "Enable Row Level Security",
            language: "sql",
            code: `ALTER TABLE ${table.schema}.${table.name} ENABLE ROW LEVEL SECURITY;`,
          },
          {
            label: "Restrict to authenticated users only",
            language: "sql",
            code: `CREATE POLICY "${table.name}_authenticated_only"\n  ON ${table.schema}.${table.name}\n  FOR ALL\n  TO authenticated\n  USING (true);`,
          },
        ],
      });
    }
  }

  return null;
}

async function testTableInsert(
  target: ScanTarget,
  table: TableInfo,
): Promise<Finding | null> {
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
        remediationSnippets: [
          {
            label: "Block anonymous inserts",
            language: "sql",
            code: `CREATE POLICY "${table.name}_deny_anon_insert"\n  ON ${table.schema}.${table.name}\n  FOR INSERT\n  TO anon\n  USING (false);`,
          },
          {
            label: "Allow inserts only for own data",
            language: "sql",
            code: `CREATE POLICY "${table.name}_insert_own"\n  ON ${table.schema}.${table.name}\n  FOR INSERT\n  TO authenticated\n  WITH CHECK (auth.uid() = user_id);`,
          },
        ],
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

    const [readResults, writeResults] = await Promise.all([
      Promise.all(tables.map((t) => testTableAccess(target, t))),
      Promise.all(tables.map((t) => testTableInsert(target, t))),
    ]);

    for (const finding of [...readResults, ...writeResults]) {
      if (finding) {
        findings.push(finding);
      }
    }

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
          remediationSnippets: [
            {
              label: "Verify your Supabase connection",
              language: "bash",
              code: `curl -s https://YOUR_PROJECT_REF.supabase.co/rest/v1/ \\\n  -H "apikey: YOUR_ANON_KEY" \\\n  -H "Accept: application/openapi+json" | head -c 200`,
            },
          ],
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
