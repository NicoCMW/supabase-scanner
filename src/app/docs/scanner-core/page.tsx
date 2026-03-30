import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo/config";
import { SiteHeader } from "@/components/site-header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DocsNav } from "@/components/docs-nav";

export const metadata: Metadata = {
  title: "Scanner Core Library Documentation | SupaScanner",
  description:
    "Use @supascanner/core to run Supabase security scans programmatically. Full TypeScript API reference with types, modules, grading system, and custom integration examples.",
  keywords: [
    "supascanner core library",
    "supabase security scanner SDK",
    "supabase security programmatic",
    "@supascanner/core",
    "supabase RLS audit library",
  ],
  alternates: {
    canonical: `${siteConfig.url}/docs/scanner-core`,
  },
  openGraph: {
    title: "Scanner Core Library - SupaScanner",
    description:
      "Use @supascanner/core to run Supabase security scans programmatically in Node.js.",
    url: `${siteConfig.url}/docs/scanner-core`,
    type: "website",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Scanner Core Library - SupaScanner",
    description:
      "Programmatic Supabase security scanning with @supascanner/core.",
  },
};

function CodeBlock({
  children,
  title,
}: {
  readonly children: string;
  readonly title?: string;
}) {
  return (
    <div className="rounded-lg overflow-hidden mb-4">
      {title && (
        <div className="bg-sand-800 px-4 py-2 text-xs text-sand-400 font-mono">
          {title}
        </div>
      )}
      <pre className="bg-sand-900 p-4 text-sm font-mono text-sand-100 overflow-x-auto">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export default function DocsScannerCorePage() {
  return (
    <main className="min-h-screen" id="main-content">
      <SiteHeader />

      <div className="px-8 pt-12 pb-24 max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Docs", href: "/docs" },
            { label: "Scanner Core", href: "/docs/scanner-core" },
          ]}
        />

        <div className="md:flex md:gap-12">
          <DocsNav currentPath="/docs/scanner-core" />

          <article className="min-w-0 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 text-sand-900">
              Scanner Core
            </h1>
            <p className="text-sand-500 text-lg mb-10 leading-relaxed">
              The{" "}
              <code className="bg-sand-100 px-1.5 py-0.5 rounded text-sand-700 text-sm">
                @supascanner/core
              </code>{" "}
              library is the scanning engine that powers the CLI, GitHub Action,
              and web app. Use it to build custom integrations.
            </p>

            {/* Installation */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Installation
              </h2>
              <CodeBlock>npm install @supascanner/core</CodeBlock>
              <p className="text-sand-400 text-xs">
                Requires Node.js 18 or later. The package is ESM-only.
              </p>
            </section>

            {/* Quick example */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Quick example
              </h2>
              <CodeBlock title="scan.ts">{`import { runScan } from "@supascanner/core";

const result = await runScan({
  supabaseUrl: "https://abc123def.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIs...",
});

console.log(\`Grade: \${result.grade}\`);
console.log(\`Findings: \${result.totalFindings}\`);

for (const mod of result.modules) {
  for (const finding of mod.findings) {
    console.log(\`[\${finding.severity}] \${finding.title}\`);
    console.log(\`  Fix: \${finding.remediation}\`);
  }
}`}</CodeBlock>
            </section>

            {/* API reference */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                API reference
              </h2>

              <h3 className="text-base font-semibold text-sand-900 mb-2">
                runScan(target, modules?)
              </h3>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                Run a full security scan against a Supabase project. Returns a
                promise that resolves to a{" "}
                <code className="bg-sand-100 px-1.5 py-0.5 rounded text-sand-700 text-xs">
                  ScanResult
                </code>
                .
              </p>
              <div className="border border-sand-200 rounded-lg overflow-hidden bg-white text-sm mb-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sand-200 bg-sand-50">
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Parameter
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Type
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sand-500">
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        target
                      </td>
                      <td className="px-4 py-2">ScanTarget</td>
                      <td className="px-4 py-2">
                        Supabase project URL and anon key
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        modules
                      </td>
                      <td className="px-4 py-2">ScanModule[]</td>
                      <td className="px-4 py-2">
                        Optional subset of modules to run (defaults to all)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-base font-semibold text-sand-900 mb-2 mt-6">
                validateTarget(target)
              </h3>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                Validate a scan target before running a scan. Returns validation
                result with errors if invalid.
              </p>
              <CodeBlock>{`import { validateTarget } from "@supascanner/core";

const { valid, errors } = validateTarget({
  supabaseUrl: "https://abc123.supabase.co",
  anonKey: "eyJhbG...",
});

if (!valid) {
  console.error("Invalid target:", errors);
}`}</CodeBlock>

              <h3 className="text-base font-semibold text-sand-900 mb-2 mt-6">
                computeGrade(findings)
              </h3>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                Compute a letter grade from a list of findings.
              </p>
              <CodeBlock>{`import { computeGrade } from "@supascanner/core";

const grade = computeGrade(result.modules.flatMap(m => m.findings));
// Returns: "A" | "B" | "C" | "D" | "F"`}</CodeBlock>
            </section>

            {/* Types */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Types
              </h2>

              <h3 className="text-base font-semibold text-sand-900 mb-2">
                ScanTarget
              </h3>
              <CodeBlock>{`interface ScanTarget {
  readonly supabaseUrl: string;  // e.g., https://abc123.supabase.co
  readonly anonKey: string;      // JWT anon key
}`}</CodeBlock>

              <h3 className="text-base font-semibold text-sand-900 mb-2 mt-6">
                ScanResult
              </h3>
              <CodeBlock>{`interface ScanResult {
  readonly target: ScanTarget;
  readonly modules: readonly ScanModuleResult[];
  readonly grade: Grade;            // "A" | "B" | "C" | "D" | "F"
  readonly totalFindings: number;
  readonly startedAt: string;       // ISO 8601
  readonly completedAt: string;     // ISO 8601
  readonly durationMs: number;
}`}</CodeBlock>

              <h3 className="text-base font-semibold text-sand-900 mb-2 mt-6">
                Finding
              </h3>
              <CodeBlock>{`interface Finding {
  readonly id: string;              // UUID
  readonly title: string;
  readonly description: string;
  readonly severity: Severity;      // "critical" | "high" | "medium" | "low"
  readonly category: FindingCategory; // "rls" | "storage" | "auth"
  readonly resource: string;        // affected table, bucket, or module
  readonly details: Record<string, unknown>;
  readonly remediation: string;     // fix instructions or SQL
}`}</CodeBlock>
            </section>

            {/* Scan modules */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Scan modules
              </h2>
              <p className="text-sand-500 text-sm leading-relaxed mb-4">
                Four built-in modules cover all Supabase security surfaces:
              </p>

              <div className="space-y-4">
                <div className="border border-sand-200 rounded-lg p-5 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-red-50 rounded flex items-center justify-center text-red-600 text-[10px] font-semibold">
                      RLS
                    </span>
                    <h3 className="text-sm font-semibold text-sand-900">
                      rlsAuditModule
                    </h3>
                  </div>
                  <p className="text-sand-500 text-xs leading-relaxed mb-2">
                    Discovers tables via the OpenAPI schema and probes each with
                    the anon key.
                  </p>
                  <ul className="text-xs text-sand-400 space-y-1">
                    <li>Tables publicly readable with data (critical)</li>
                    <li>Tables publicly accessible when empty (high)</li>
                    <li>Tables allowing anonymous INSERT (critical)</li>
                  </ul>
                </div>

                <div className="border border-sand-200 rounded-lg p-5 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-amber-50 rounded flex items-center justify-center text-amber-600 text-[10px] font-semibold">
                      STR
                    </span>
                    <h3 className="text-sm font-semibold text-sand-900">
                      storageAuditModule
                    </h3>
                  </div>
                  <p className="text-sand-500 text-xs leading-relaxed mb-2">
                    Checks every storage bucket for public access and upload
                    permissions.
                  </p>
                  <ul className="text-xs text-sand-400 space-y-1">
                    <li>Bucket allows anonymous uploads (critical)</li>
                    <li>Bucket may allow anonymous uploads (high)</li>
                    <li>Bucket is listable with objects (high) or empty (medium)</li>
                    <li>Bucket is marked public (medium)</li>
                    <li>No storage buckets found (low)</li>
                  </ul>
                </div>

                <div className="border border-sand-200 rounded-lg p-5 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center text-blue-600 text-[10px] font-semibold">
                      AUTH
                    </span>
                    <h3 className="text-sm font-semibold text-sand-900">
                      authAuditModule
                    </h3>
                  </div>
                  <p className="text-sand-500 text-xs leading-relaxed mb-2">
                    Checks core authentication configuration.
                  </p>
                  <ul className="text-xs text-sand-400 space-y-1">
                    <li>Email confirmation disabled (high)</li>
                    <li>User enumeration possible (medium)</li>
                    <li>Auth settings publicly readable (low)</li>
                  </ul>
                </div>

                <div className="border border-sand-200 rounded-lg p-5 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center text-blue-600 text-[10px] font-semibold">
                      SEC
                    </span>
                    <h3 className="text-sm font-semibold text-sand-900">
                      authSecurityModule
                    </h3>
                  </div>
                  <p className="text-sand-500 text-xs leading-relaxed mb-2">
                    Advanced auth security checks for password policy, MFA, and
                    rate limiting.
                  </p>
                  <ul className="text-xs text-sand-400 space-y-1">
                    <li>Weak password policy (critical)</li>
                    <li>Password minimum too short (medium)</li>
                    <li>MFA disabled (high)</li>
                    <li>JWT tokens have long expiry (low)</li>
                    <li>Too many OAuth providers enabled (medium)</li>
                    <li>Auth rate limiting missing (high)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Grading system */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Grading system
              </h2>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                The grade is computed from weighted severity scores:
              </p>
              <div className="border border-sand-200 rounded-lg overflow-hidden bg-white text-sm mb-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sand-200 bg-sand-50">
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Severity
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sand-500">
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2">Critical</td>
                      <td className="px-4 py-2">10</td>
                    </tr>
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2">High</td>
                      <td className="px-4 py-2">7</td>
                    </tr>
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2">Medium</td>
                      <td className="px-4 py-2">4</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">Low</td>
                      <td className="px-4 py-2">1</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="border border-sand-200 rounded-lg overflow-hidden bg-white text-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sand-200 bg-sand-50">
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Grade
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Total points
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sand-500">
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-semibold text-green-700">A</td>
                      <td className="px-4 py-2">0 -- 4</td>
                    </tr>
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-semibold text-blue-700">B</td>
                      <td className="px-4 py-2">5 -- 9</td>
                    </tr>
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-semibold text-amber-700">C</td>
                      <td className="px-4 py-2">10 -- 19</td>
                    </tr>
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-semibold text-orange-700">D</td>
                      <td className="px-4 py-2">20 -- 29</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-semibold text-red-700">F</td>
                      <td className="px-4 py-2">30+</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Custom integration example */}
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Custom integration example
              </h2>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                Run a scan with specific modules and post results to a webhook:
              </p>
              <CodeBlock title="webhook-scan.ts">{`import {
  runScan,
  rlsAuditModule,
  storageAuditModule,
} from "@supascanner/core";

const result = await runScan(
  {
    supabaseUrl: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
  },
  [rlsAuditModule, storageAuditModule]
);

// Post results to your monitoring webhook
await fetch("https://hooks.example.com/security", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    grade: result.grade,
    totalFindings: result.totalFindings,
    critical: result.modules
      .flatMap(m => m.findings)
      .filter(f => f.severity === "critical").length,
    timestamp: result.completedAt,
  }),
});`}</CodeBlock>
            </section>

            {/* Navigation */}
            <section className="mt-14 pt-8 border-t border-sand-200 flex items-center justify-between">
              <a
                href="/docs/api"
                className="text-sm text-sand-500 hover:text-sand-900 transition-colors"
              >
                &larr; API Reference
              </a>
              <a
                href="/docs/badge"
                className="text-sm text-sand-500 hover:text-sand-900 transition-colors"
              >
                Badge &rarr;
              </a>
            </section>
          </article>
        </div>
      </div>

      <footer className="px-8 py-8 max-w-5xl mx-auto border-t border-sand-200 text-center text-xs text-sand-400">
        <p className="mb-2">SupaScanner. Your credentials are never persisted.</p>
        <div className="flex items-center justify-center gap-4">
          <a href="/privacy" className="hover:text-sand-600 transition-colors">
            Privacy Policy
          </a>
          <a href="/terms" className="hover:text-sand-600 transition-colors">
            Terms of Service
          </a>
        </div>
      </footer>
    </main>
  );
}
