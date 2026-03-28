import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo/config";
import { SiteHeader } from "@/components/site-header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DocsNav } from "@/components/docs-nav";

export const metadata: Metadata = {
  title: "CLI & CI/CD Documentation | SupaScanner",
  description:
    "Install the supascanner CLI to run Supabase security scans from the terminal. Integrate with GitHub Actions for automated CI/CD security gating.",
  keywords: [
    "supabase security scanner CLI",
    "supabase security CI/CD",
    "supabase RLS checker CLI",
    "supabase github action security",
    "supascanner CLI",
  ],
  alternates: {
    canonical: `${siteConfig.url}/docs/cli`,
  },
  openGraph: {
    title: "CLI & CI/CD Documentation - SupaScanner",
    description:
      "Install the supascanner CLI to run Supabase security scans from the terminal and automate them in CI/CD pipelines.",
    url: `${siteConfig.url}/docs/cli`,
    type: "website",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "CLI & CI/CD Documentation - SupaScanner",
    description:
      "Run Supabase security scans from the terminal and automate them in CI/CD pipelines.",
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

export default function DocsCliPage() {
  return (
    <main className="min-h-screen" id="main-content">
      <SiteHeader />

      <div className="px-8 pt-12 pb-24 max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Docs", href: "/docs" },
            { label: "CLI", href: "/docs/cli" },
          ]}
        />

        <div className="md:flex md:gap-12">
          <DocsNav currentPath="/docs/cli" />

          <article className="min-w-0 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 text-sand-900">
              CLI &amp; CI/CD
            </h1>
            <p className="text-sand-500 text-lg mb-10 leading-relaxed">
              Run security scans from the terminal or automate them in your
              CI/CD pipeline with the GitHub Action.
            </p>

            {/* Installation */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Installation
              </h2>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                Install the CLI globally via npm:
              </p>
              <CodeBlock>npm install -g supascanner</CodeBlock>
              <p className="text-sand-500 text-sm leading-relaxed">
                Or run it without installing using{" "}
                <code className="bg-sand-100 px-1.5 py-0.5 rounded text-sand-700 text-xs">
                  npx
                </code>
                :
              </p>
              <CodeBlock>npx supascanner scan --url &lt;url&gt; --key &lt;key&gt;</CodeBlock>
              <p className="text-sand-400 text-xs">
                Requires Node.js 18 or later.
              </p>
            </section>

            {/* Basic usage */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Basic usage
              </h2>
              <CodeBlock>{`supascanner scan \\
  --url https://abc123def.supabase.co \\
  --key eyJhbGciOiJIUzI1NiIs...`}</CodeBlock>
              <p className="text-sand-500 text-sm leading-relaxed mb-4">
                This runs all three audit modules (RLS, Storage, Auth) and
                prints results as a table.
              </p>

              <h3 className="text-base font-semibold text-sand-900 mb-2">
                Options
              </h3>
              <div className="border border-sand-200 rounded-lg overflow-hidden bg-white text-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sand-200 bg-sand-50">
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Flag
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Default
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sand-500">
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        --url &lt;url&gt;
                      </td>
                      <td className="px-4 py-2">--</td>
                      <td className="px-4 py-2">Supabase project URL</td>
                    </tr>
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        --key &lt;key&gt;
                      </td>
                      <td className="px-4 py-2">--</td>
                      <td className="px-4 py-2">Supabase anon / public key</td>
                    </tr>
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        --format &lt;fmt&gt;
                      </td>
                      <td className="px-4 py-2">
                        <code className="text-xs">table</code>
                      </td>
                      <td className="px-4 py-2">
                        Output format:{" "}
                        <code className="text-xs">json</code>,{" "}
                        <code className="text-xs">table</code>, or{" "}
                        <code className="text-xs">markdown</code>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        --threshold &lt;level&gt;
                      </td>
                      <td className="px-4 py-2">--</td>
                      <td className="px-4 py-2">
                        Exit with code 1 if findings at or above:{" "}
                        <code className="text-xs">critical</code>,{" "}
                        <code className="text-xs">high</code>, or{" "}
                        <code className="text-xs">medium</code>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Configuration */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Configuration file
              </h2>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                Create a{" "}
                <code className="bg-sand-100 px-1.5 py-0.5 rounded text-sand-700 text-xs">
                  .supascanner.config.json
                </code>{" "}
                in your project root to avoid passing flags every time:
              </p>
              <CodeBlock title=".supascanner.config.json">{`{
  "url": "https://abc123def.supabase.co",
  "anonKey": "eyJhbGciOiJIUzI1NiIs...",
  "format": "table",
  "threshold": "high"
}`}</CodeBlock>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                The CLI resolves values in this order:
              </p>
              <ol className="list-decimal list-inside text-sm text-sand-500 space-y-1">
                <li>Command-line flags</li>
                <li>
                  <code className="bg-sand-100 px-1.5 py-0.5 rounded text-sand-700 text-xs">
                    .supascanner.config.json
                  </code>
                </li>
                <li>
                  Environment variables:{" "}
                  <code className="bg-sand-100 px-1.5 py-0.5 rounded text-sand-700 text-xs">
                    SUPABASE_URL
                  </code>{" "}
                  and{" "}
                  <code className="bg-sand-100 px-1.5 py-0.5 rounded text-sand-700 text-xs">
                    SUPABASE_ANON_KEY
                  </code>
                </li>
              </ol>
            </section>

            {/* Exit codes */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Exit codes
              </h2>
              <div className="border border-sand-200 rounded-lg overflow-hidden bg-white text-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sand-200 bg-sand-50">
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Code
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Meaning
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sand-500">
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-sand-700">0</td>
                      <td className="px-4 py-2">
                        Scan completed, no findings above threshold
                      </td>
                    </tr>
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-sand-700">1</td>
                      <td className="px-4 py-2">
                        Findings at or above the configured threshold
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-sand-700">2</td>
                      <td className="px-4 py-2">
                        Runtime error (invalid URL, network failure, etc.)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sand-400 text-xs mt-2">
                Use exit code 1 to gate deployments in CI -- the pipeline fails
                only when real security issues are found.
              </p>
            </section>

            {/* GitHub Action */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                GitHub Action
              </h2>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                The official GitHub Action runs a scan on every PR or push and
                posts results as a PR comment. Add this workflow to{" "}
                <code className="bg-sand-100 px-1.5 py-0.5 rounded text-sand-700 text-xs">
                  .github/workflows/security-scan.yml
                </code>
                :
              </p>
              <CodeBlock title=".github/workflows/security-scan.yml">{`name: Supabase Security Scan

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

jobs:
  scan:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run SupaScanner
        id: scan
        uses: NicoCMW/supabase-scanner@v1
        with:
          supabase-url: \${{ secrets.SUPABASE_URL }}
          supabase-anon-key: \${{ secrets.SUPABASE_ANON_KEY }}
          threshold: "high"`}</CodeBlock>

              <h3 className="text-base font-semibold text-sand-900 mb-2 mt-6">
                Action inputs
              </h3>
              <div className="border border-sand-200 rounded-lg overflow-hidden bg-white text-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sand-200 bg-sand-50">
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Input
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Required
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Default
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sand-500">
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        supabase-url
                      </td>
                      <td className="px-4 py-2">Yes</td>
                      <td className="px-4 py-2">--</td>
                      <td className="px-4 py-2">Supabase project URL</td>
                    </tr>
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        supabase-anon-key
                      </td>
                      <td className="px-4 py-2">Yes</td>
                      <td className="px-4 py-2">--</td>
                      <td className="px-4 py-2">Supabase anon / public key</td>
                    </tr>
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        threshold
                      </td>
                      <td className="px-4 py-2">No</td>
                      <td className="px-4 py-2">
                        <code className="text-xs">high</code>
                      </td>
                      <td className="px-4 py-2">
                        Fail threshold: critical, high, or medium
                      </td>
                    </tr>
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        comment-on-pr
                      </td>
                      <td className="px-4 py-2">No</td>
                      <td className="px-4 py-2">
                        <code className="text-xs">true</code>
                      </td>
                      <td className="px-4 py-2">Post results as a PR comment</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        github-token
                      </td>
                      <td className="px-4 py-2">No</td>
                      <td className="px-4 py-2">
                        <code className="text-xs">GITHUB_TOKEN</code>
                      </td>
                      <td className="px-4 py-2">Token for posting PR comments</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-base font-semibold text-sand-900 mb-2 mt-6">
                Action outputs
              </h3>
              <div className="border border-sand-200 rounded-lg overflow-hidden bg-white text-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sand-200 bg-sand-50">
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Output
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sand-500">
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        grade
                      </td>
                      <td className="px-4 py-2">
                        Overall security grade (A through F)
                      </td>
                    </tr>
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        total-findings
                      </td>
                      <td className="px-4 py-2">Total number of findings</td>
                    </tr>
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        critical-count
                      </td>
                      <td className="px-4 py-2">Number of critical findings</td>
                    </tr>
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        high-count
                      </td>
                      <td className="px-4 py-2">Number of high findings</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        threshold-exceeded
                      </td>
                      <td className="px-4 py-2">
                        Whether the threshold was exceeded (true/false)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Conditional steps example */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Using outputs in workflows
              </h2>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                Use the action outputs to conditionally run other steps:
              </p>
              <CodeBlock>{`- name: Run SupaScanner
  id: scan
  uses: NicoCMW/supabase-scanner@v1
  with:
    supabase-url: \${{ secrets.SUPABASE_URL }}
    supabase-anon-key: \${{ secrets.SUPABASE_ANON_KEY }}
    threshold: "critical"

- name: Notify on poor grade
  if: steps.scan.outputs.grade == 'F'
  run: echo "Security grade is F - review required"`}</CodeBlock>
            </section>

            {/* Secrets setup */}
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Setting up secrets
              </h2>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                Add these secrets to your GitHub repository under{" "}
                <strong className="text-sand-700">
                  Settings &gt; Secrets and variables &gt; Actions
                </strong>
                :
              </p>
              <div className="border border-sand-200 rounded-lg overflow-hidden bg-white text-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sand-200 bg-sand-50">
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Secret
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sand-500">
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        SUPABASE_URL
                      </td>
                      <td className="px-4 py-2">
                        Your project URL (e.g.,{" "}
                        <code className="text-xs">
                          https://abc123.supabase.co
                        </code>
                        )
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        SUPABASE_ANON_KEY
                      </td>
                      <td className="px-4 py-2">
                        Your Supabase anon / public key
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Navigation */}
            <section className="mt-14 pt-8 border-t border-sand-200 flex items-center justify-between">
              <a
                href="/docs"
                className="text-sm text-sand-500 hover:text-sand-900 transition-colors"
              >
                &larr; Quick Start
              </a>
              <a
                href="/docs/api"
                className="text-sm text-sand-500 hover:text-sand-900 transition-colors"
              >
                API Reference &rarr;
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
