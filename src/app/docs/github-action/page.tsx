import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo/config";
import { SiteHeader } from "@/components/site-header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DocsNav } from "@/components/docs-nav";

export const metadata: Metadata = {
  title: "GitHub Action Documentation | SupaScanner",
  description:
    "Automate Supabase security scans in your CI/CD pipeline with the official SupaScanner GitHub Action. PR comments, threshold gating, and workflow examples.",
  keywords: [
    "supabase security github action",
    "supabase CI/CD security scan",
    "supascanner github action",
    "supabase security automation",
    "supabase RLS github action",
  ],
  alternates: {
    canonical: `${siteConfig.url}/docs/github-action`,
  },
  openGraph: {
    title: "GitHub Action Documentation - SupaScanner",
    description:
      "Automate Supabase security scans in CI/CD with the official SupaScanner GitHub Action.",
    url: `${siteConfig.url}/docs/github-action`,
    type: "website",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "GitHub Action Documentation - SupaScanner",
    description:
      "Automate Supabase security scans in CI/CD with the official SupaScanner GitHub Action.",
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

export default function DocsGitHubActionPage() {
  return (
    <main className="min-h-screen" id="main-content">
      <SiteHeader />

      <div className="px-8 pt-12 pb-24 max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Docs", href: "/docs" },
            { label: "GitHub Action", href: "/docs/github-action" },
          ]}
        />

        <div className="md:flex md:gap-12">
          <DocsNav currentPath="/docs/github-action" />

          <article className="min-w-0 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 text-sand-900">
              GitHub Action
            </h1>
            <p className="text-sand-500 text-lg mb-10 leading-relaxed">
              Run security scans automatically on every PR and push. The action
              posts results as a PR comment and can gate merges based on
              severity thresholds.
            </p>

            {/* Quick setup */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Quick setup
              </h2>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                Add this workflow file to your repository:
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
              <p className="text-sand-400 text-xs">
                The action requires Node.js 20, which is set up automatically.
              </p>
            </section>

            {/* Inputs */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Inputs
              </h2>
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
                      <td className="px-4 py-2">
                        Supabase project URL (e.g.,
                        https://abc123.supabase.co)
                      </td>
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
                        Fail severity:{" "}
                        <code className="text-xs">critical</code>,{" "}
                        <code className="text-xs">high</code>, or{" "}
                        <code className="text-xs">medium</code>
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
                      <td className="px-4 py-2">
                        Post scan results as a PR comment
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        github-token
                      </td>
                      <td className="px-4 py-2">No</td>
                      <td className="px-4 py-2">
                        <code className="text-xs">GITHUB_TOKEN</code>
                      </td>
                      <td className="px-4 py-2">
                        Token for posting PR comments
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Outputs */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Outputs
              </h2>
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
                      <td className="px-4 py-2">
                        Total number of security findings
                      </td>
                    </tr>
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        critical-count
                      </td>
                      <td className="px-4 py-2">
                        Number of critical severity findings
                      </td>
                    </tr>
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        high-count
                      </td>
                      <td className="px-4 py-2">
                        Number of high severity findings
                      </td>
                    </tr>
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        threshold-exceeded
                      </td>
                      <td className="px-4 py-2">
                        Whether the threshold was exceeded (true/false)
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        report-markdown
                      </td>
                      <td className="px-4 py-2">
                        Path to the generated markdown report file
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* PR comments */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                PR comments
              </h2>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                When{" "}
                <code className="bg-sand-100 px-1.5 py-0.5 rounded text-sand-700 text-xs">
                  comment-on-pr
                </code>{" "}
                is enabled (the default), the action posts a markdown report as
                a PR comment on every{" "}
                <code className="bg-sand-100 px-1.5 py-0.5 rounded text-sand-700 text-xs">
                  pull_request
                </code>{" "}
                event.
              </p>
              <div className="bg-white border border-sand-200 rounded-lg p-4 text-sm text-sand-500 space-y-2">
                <p>
                  The comment includes a hidden marker so subsequent runs
                  update the existing comment instead of creating duplicates.
                </p>
                <p>
                  The{" "}
                  <code className="bg-sand-100 px-1.5 py-0.5 rounded text-sand-700 text-xs">
                    pull-requests: write
                  </code>{" "}
                  permission is required in your workflow for this feature.
                </p>
              </div>
            </section>

            {/* Threshold gating */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Threshold gating
              </h2>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                The{" "}
                <code className="bg-sand-100 px-1.5 py-0.5 rounded text-sand-700 text-xs">
                  threshold
                </code>{" "}
                input controls when the action exits with a failure code:
              </p>
              <div className="border border-sand-200 rounded-lg overflow-hidden bg-white text-sm mb-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sand-200 bg-sand-50">
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Threshold
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Fails when findings are
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sand-500">
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        critical
                      </td>
                      <td className="px-4 py-2">Critical only</td>
                    </tr>
                    <tr className="border-b border-sand-100">
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        high
                      </td>
                      <td className="px-4 py-2">Critical or high</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        medium
                      </td>
                      <td className="px-4 py-2">Critical, high, or medium</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sand-500 text-sm leading-relaxed">
                Combine this with branch protection rules to prevent merging
                PRs that introduce security regressions.
              </p>
            </section>

            {/* Using outputs */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Using outputs in workflows
              </h2>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                Reference the action outputs in subsequent steps to build
                conditional workflows:
              </p>
              <CodeBlock title="Conditional notification">{`- name: Run SupaScanner
  id: scan
  uses: NicoCMW/supabase-scanner@v1
  with:
    supabase-url: \${{ secrets.SUPABASE_URL }}
    supabase-anon-key: \${{ secrets.SUPABASE_ANON_KEY }}
    threshold: "critical"

- name: Notify on poor grade
  if: steps.scan.outputs.grade == 'F'
  run: echo "Security grade is F - review required"

- name: Upload report artifact
  uses: actions/upload-artifact@v4
  with:
    name: security-report
    path: \${{ steps.scan.outputs.report-markdown }}`}</CodeBlock>
            </section>

            {/* Secrets setup */}
            <section className="mb-12">
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

            {/* Scheduled scans */}
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Scheduled scans
              </h2>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                Run scans on a schedule with the{" "}
                <code className="bg-sand-100 px-1.5 py-0.5 rounded text-sand-700 text-xs">
                  schedule
                </code>{" "}
                trigger:
              </p>
              <CodeBlock title=".github/workflows/weekly-scan.yml">{`name: Weekly Security Scan

on:
  schedule:
    - cron: "0 9 * * 1"  # Every Monday at 9am UTC

permissions:
  contents: read

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run SupaScanner
        uses: NicoCMW/supabase-scanner@v1
        with:
          supabase-url: \${{ secrets.SUPABASE_URL }}
          supabase-anon-key: \${{ secrets.SUPABASE_ANON_KEY }}
          comment-on-pr: "false"
          threshold: "medium"`}</CodeBlock>
              <p className="text-sand-400 text-xs">
                Disable PR comments for scheduled runs since there is no pull
                request context.
              </p>
            </section>

            {/* Navigation */}
            <section className="mt-14 pt-8 border-t border-sand-200 flex items-center justify-between">
              <a
                href="/docs/cli"
                className="text-sm text-sand-500 hover:text-sand-900 transition-colors"
              >
                &larr; CLI
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
