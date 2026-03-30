import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo/config";
import { SiteHeader } from "@/components/site-header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DocsNav } from "@/components/docs-nav";

export const metadata: Metadata = {
  title: "API Reference | SupaScanner",
  description:
    "SupaScanner REST API reference. Submit security scans, retrieve results, and check usage programmatically with Bearer token authentication.",
  keywords: [
    "supabase security scanner API",
    "supabase security scan API",
    "supascanner API reference",
    "supabase RLS checker API",
  ],
  alternates: {
    canonical: `${siteConfig.url}/docs/api`,
  },
  openGraph: {
    title: "API Reference - SupaScanner",
    description:
      "SupaScanner REST API reference. Submit scans, retrieve results, and check usage programmatically.",
    url: `${siteConfig.url}/docs/api`,
    type: "website",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "API Reference - SupaScanner",
    description:
      "Submit Supabase security scans and retrieve results via the SupaScanner REST API.",
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

function MethodBadge({ method }: { readonly method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-green-50 text-green-700",
    POST: "bg-blue-50 text-blue-700",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold font-mono ${colors[method] ?? "bg-sand-100 text-sand-700"}`}
    >
      {method}
    </span>
  );
}

export default function DocsApiPage() {
  return (
    <main className="min-h-screen" id="main-content">
      <SiteHeader />

      <div className="px-8 pt-12 pb-24 max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Docs", href: "/docs" },
            { label: "API Reference", href: "/docs/api" },
          ]}
        />

        <div className="md:flex md:gap-12">
          <DocsNav currentPath="/docs/api" />

          <article className="min-w-0 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 text-sand-900">
              API Reference
            </h1>
            <p className="text-sand-500 text-lg mb-10 leading-relaxed">
              Submit scans and retrieve results programmatically. All endpoints
              require authentication and return JSON.
            </p>

            {/* Authentication */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Authentication
              </h2>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                All API requests require a valid session. Authenticate by
                signing in through the web app -- your session cookie is
                automatically included in requests from the same origin.
              </p>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                For server-to-server usage, include your session token as a
                Bearer token in the{" "}
                <code className="bg-sand-100 px-1.5 py-0.5 rounded text-sand-700 text-xs">
                  Authorization
                </code>{" "}
                header:
              </p>
              <CodeBlock>{`curl -X POST https://supascanner.com/api/scan \\
  -H "Authorization: Bearer <your-session-token>" \\
  -H "Content-Type: application/json" \\
  -d '{"supabaseUrl": "...", "anonKey": "..."}'`}</CodeBlock>
              <div className="bg-white border border-sand-200 rounded-lg p-4 text-sm text-sand-500">
                <p>
                  <strong className="text-sand-700">Base URL:</strong>{" "}
                  <code className="bg-sand-100 px-1.5 py-0.5 rounded text-sand-700 text-xs">
                    https://supascanner.com
                  </code>
                </p>
              </div>
            </section>

            {/* Rate limits */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Rate limits and quotas
              </h2>
              <div className="border border-sand-200 rounded-lg overflow-hidden bg-white text-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sand-200 bg-sand-50">
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Plan
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Scans / month
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sand-500">
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-medium text-sand-700">
                        Free
                      </td>
                      <td className="px-4 py-2">3</td>
                      <td className="px-4 py-2">$0</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-sand-700">
                        Pro
                      </td>
                      <td className="px-4 py-2">Unlimited</td>
                      <td className="px-4 py-2">$29/month</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sand-400 text-xs mt-2">
                When the quota is exceeded, the scan endpoint returns{" "}
                <code className="text-xs">429 Too Many Requests</code> with
                usage details in the response body.
              </p>
            </section>

            {/* POST /api/scan */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <MethodBadge method="POST" />
                <h2 className="text-xl font-semibold text-sand-900">
                  /api/scan
                </h2>
              </div>
              <p className="text-sand-500 text-sm leading-relaxed mb-4">
                Submit a new security scan. Runs all three audit modules (RLS,
                Storage, Auth) and returns the results synchronously.
              </p>

              <h3 className="text-base font-semibold text-sand-900 mb-2">
                Request body
              </h3>
              <div className="border border-sand-200 rounded-lg overflow-hidden bg-white text-sm mb-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sand-200 bg-sand-50">
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Field
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Type
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Required
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sand-500">
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        supabaseUrl
                      </td>
                      <td className="px-4 py-2">string</td>
                      <td className="px-4 py-2">Yes</td>
                      <td className="px-4 py-2">
                        Supabase project URL
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        anonKey
                      </td>
                      <td className="px-4 py-2">string</td>
                      <td className="px-4 py-2">Yes</td>
                      <td className="px-4 py-2">
                        Supabase anon / public key
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-base font-semibold text-sand-900 mb-2">
                Example request
              </h3>
              <CodeBlock>{`curl -X POST https://supascanner.com/api/scan \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "supabaseUrl": "https://abc123def.supabase.co",
    "anonKey": "eyJhbGciOiJIUzI1NiIs..."
  }'`}</CodeBlock>

              <h3 className="text-base font-semibold text-sand-900 mb-2">
                Response (200)
              </h3>
              <CodeBlock>{`{
  "scanJobId": "uuid",
  "grade": "B",
  "totalFindings": 4,
  "modules": [
    {
      "module": "rls",
      "findings": [
        {
          "title": "Table 'profiles' allows anonymous read",
          "description": "The profiles table returns data...",
          "severity": "high",
          "category": "rls",
          "resource": "profiles",
          "remediation": "ALTER TABLE profiles ENABLE..."
        }
      ]
    },
    {
      "module": "storage",
      "findings": []
    },
    {
      "module": "auth",
      "findings": [...]
    }
  ],
  "durationMs": 3420,
  "startedAt": "2026-03-28T10:00:00.000Z",
  "completedAt": "2026-03-28T10:00:03.420Z"
}`}</CodeBlock>

              <h3 className="text-base font-semibold text-sand-900 mb-2">
                Error responses
              </h3>
              <div className="border border-sand-200 rounded-lg overflow-hidden bg-white text-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sand-200 bg-sand-50">
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Status
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sand-500">
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-sand-700">
                        400
                      </td>
                      <td className="px-4 py-2">
                        Invalid JSON or missing required fields
                      </td>
                    </tr>
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-sand-700">
                        401
                      </td>
                      <td className="px-4 py-2">
                        Authentication required
                      </td>
                    </tr>
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-sand-700">
                        422
                      </td>
                      <td className="px-4 py-2">
                        Invalid scan target (bad URL or key format)
                      </td>
                    </tr>
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-sand-700">
                        429
                      </td>
                      <td className="px-4 py-2">
                        Monthly scan quota exceeded
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-sand-700">
                        500
                      </td>
                      <td className="px-4 py-2">
                        Scan failed (network error, unreachable project)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* GET /api/billing/usage */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <MethodBadge method="GET" />
                <h2 className="text-xl font-semibold text-sand-900">
                  /api/billing/usage
                </h2>
              </div>
              <p className="text-sand-500 text-sm leading-relaxed mb-4">
                Retrieve your current scan usage and quota for the billing
                period.
              </p>

              <h3 className="text-base font-semibold text-sand-900 mb-2">
                Example request
              </h3>
              <CodeBlock>{`curl https://supascanner.com/api/billing/usage \\
  -H "Authorization: Bearer <token>"`}</CodeBlock>

              <h3 className="text-base font-semibold text-sand-900 mb-2">
                Response (200)
              </h3>
              <CodeBlock>{`{
  "plan": "free",
  "scansUsed": 2,
  "scansLimit": 3,
  "periodStart": "2026-03-01T00:00:00.000Z",
  "periodEnd": "2026-04-01T00:00:00.000Z"
}`}</CodeBlock>
            </section>

            {/* POST /api/share */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <MethodBadge method="POST" />
                <h2 className="text-xl font-semibold text-sand-900">
                  /api/share
                </h2>
              </div>
              <p className="text-sand-500 text-sm leading-relaxed mb-4">
                Generate a public shareable link for a completed scan result.
              </p>

              <h3 className="text-base font-semibold text-sand-900 mb-2">
                Request body
              </h3>
              <div className="border border-sand-200 rounded-lg overflow-hidden bg-white text-sm mb-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sand-200 bg-sand-50">
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Field
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
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        scanJobId
                      </td>
                      <td className="px-4 py-2">string</td>
                      <td className="px-4 py-2">
                        ID of the completed scan job
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-base font-semibold text-sand-900 mb-2">
                Response (200)
              </h3>
              <CodeBlock>{`{
  "shareUrl": "https://supascanner.com/results/abc123"
}`}</CodeBlock>
            </section>

            {/* GET /api/health */}
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <MethodBadge method="GET" />
                <h2 className="text-xl font-semibold text-sand-900">
                  /api/health
                </h2>
              </div>
              <p className="text-sand-500 text-sm leading-relaxed mb-4">
                Health check endpoint. No authentication required.
              </p>
              <CodeBlock>{`curl https://supascanner.com/api/health`}</CodeBlock>
              <p className="text-sand-500 text-sm">
                Returns{" "}
                <code className="bg-sand-100 px-1.5 py-0.5 rounded text-sand-700 text-xs">
                  200 OK
                </code>{" "}
                when the service is healthy.
              </p>
            </section>

            {/* Navigation */}
            <section className="mt-14 pt-8 border-t border-sand-200 flex items-center justify-between">
              <a
                href="/docs/github-action"
                className="text-sm text-sand-500 hover:text-sand-900 transition-colors"
              >
                &larr; GitHub Action
              </a>
              <a
                href="/docs/scanner-core"
                className="text-sm text-sand-500 hover:text-sand-900 transition-colors"
              >
                Scanner Core &rarr;
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
