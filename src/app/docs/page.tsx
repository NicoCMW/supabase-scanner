import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo/config";
import { SiteHeader } from "@/components/site-header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DocsNav } from "@/components/docs-nav";

export const metadata: Metadata = {
  title: "Quick Start - Developer Documentation | SupaScanner",
  description:
    "Get started with SupaScanner in under 2 minutes. Sign up, enter your Supabase project URL and anon key, run your first security scan, and fix issues with copy-paste SQL.",
  keywords: [
    "supabase security scanner",
    "supabase RLS checker",
    "supabase security guide",
    "supabase security audit",
    "supabase row level security",
  ],
  alternates: {
    canonical: `${siteConfig.url}/docs`,
  },
  openGraph: {
    title: "Quick Start - SupaScanner Developer Documentation",
    description:
      "Get started with SupaScanner in under 2 minutes. Run your first Supabase security scan and fix RLS gaps, storage issues, and auth misconfigurations.",
    url: `${siteConfig.url}/docs`,
    type: "website",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Quick Start - SupaScanner Developer Documentation",
    description:
      "Get started with SupaScanner in under 2 minutes. Scan your Supabase project for security vulnerabilities.",
  },
};

export default function DocsQuickStart() {
  return (
    <main className="min-h-screen" id="main-content">
      <SiteHeader />

      <div className="px-8 pt-12 pb-24 max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Docs", href: "/docs" },
          ]}
        />

        <div className="md:flex md:gap-12">
          <DocsNav currentPath="/docs" />

          <article className="min-w-0 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 text-sand-900">
              Quick Start
            </h1>
            <p className="text-sand-500 text-lg mb-10 leading-relaxed">
              Run your first Supabase security scan in under 2 minutes. No
              credit card required.
            </p>

            {/* Step 1 */}
            <section className="mb-10">
              <div className="flex items-start gap-4 mb-3">
                <div className="shrink-0 w-7 h-7 rounded-full border border-sand-200 flex items-center justify-center text-xs font-medium text-sand-500">
                  1
                </div>
                <h2 className="text-xl font-semibold text-sand-900">
                  Create a free account
                </h2>
              </div>
              <div className="ml-11">
                <p className="text-sand-500 text-sm leading-relaxed mb-3">
                  Head to the{" "}
                  <a
                    href="/login"
                    className="text-sand-900 font-medium underline hover:text-sand-600 transition-colors"
                  >
                    sign-in page
                  </a>{" "}
                  and enter your email. You will receive a magic link -- click it
                  to log in. No password required.
                </p>
                <div className="bg-white border border-sand-200 rounded-lg p-4 text-sm text-sand-500">
                  <p>
                    The free plan includes <strong className="text-sand-900">3 scans per month</strong> with
                    all audit modules and AI fix suggestions.
                  </p>
                </div>
              </div>
            </section>

            {/* Step 2 */}
            <section className="mb-10">
              <div className="flex items-start gap-4 mb-3">
                <div className="shrink-0 w-7 h-7 rounded-full border border-sand-200 flex items-center justify-center text-xs font-medium text-sand-500">
                  2
                </div>
                <h2 className="text-xl font-semibold text-sand-900">
                  Find your Supabase project URL and anon key
                </h2>
              </div>
              <div className="ml-11">
                <p className="text-sand-500 text-sm leading-relaxed mb-3">
                  Open your Supabase dashboard, go to{" "}
                  <strong className="text-sand-700">Settings &gt; API</strong>,
                  and copy the two values:
                </p>
                <div className="bg-sand-900 rounded-lg p-4 text-sm font-mono text-sand-100 overflow-x-auto mb-3">
                  <p className="text-sand-400 mb-1"># Project URL</p>
                  <p>https://abc123def.supabase.co</p>
                  <p className="text-sand-400 mt-3 mb-1"># anon / public key</p>
                  <p>eyJhbGciOiJIUzI1NiIsInR5cCI6...</p>
                </div>
                <p className="text-sand-400 text-xs">
                  The anon key is your public key -- the same one your frontend
                  already uses. It is safe to share with SupaScanner.
                </p>
              </div>
            </section>

            {/* Step 3 */}
            <section className="mb-10">
              <div className="flex items-start gap-4 mb-3">
                <div className="shrink-0 w-7 h-7 rounded-full border border-sand-200 flex items-center justify-center text-xs font-medium text-sand-500">
                  3
                </div>
                <h2 className="text-xl font-semibold text-sand-900">
                  Run your first scan
                </h2>
              </div>
              <div className="ml-11">
                <p className="text-sand-500 text-sm leading-relaxed mb-3">
                  From your{" "}
                  <a
                    href="/dashboard"
                    className="text-sand-900 font-medium underline hover:text-sand-600 transition-colors"
                  >
                    dashboard
                  </a>
                  , paste your project URL and anon key into the scan form and
                  click <strong className="text-sand-700">Scan now</strong>.
                </p>
                <p className="text-sand-500 text-sm leading-relaxed mb-3">
                  The scan runs three audit modules in parallel:
                </p>
                <ul className="space-y-2 text-sm text-sand-500 mb-3">
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5 w-5 h-5 bg-red-50 rounded flex items-center justify-center text-red-600 text-[10px] font-semibold">
                      RLS
                    </span>
                    <span>
                      <strong className="text-sand-700">Row Level Security</strong>{" "}
                      -- discovers every table and checks for anonymous read/write access
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5 w-5 h-5 bg-amber-50 rounded flex items-center justify-center text-amber-600 text-[10px] font-semibold">
                      STR
                    </span>
                    <span>
                      <strong className="text-sand-700">Storage Buckets</strong>{" "}
                      -- checks for public access, open directory listing, and anonymous uploads
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5 w-5 h-5 bg-blue-50 rounded flex items-center justify-center text-blue-600 text-[10px] font-semibold">
                      AUTH
                    </span>
                    <span>
                      <strong className="text-sand-700">Auth Configuration</strong>{" "}
                      -- verifies email confirmation, exposed settings, and common misconfigurations
                    </span>
                  </li>
                </ul>
                <p className="text-sand-400 text-xs">
                  All checks are read-only. Nothing is written, deleted, or
                  modified in your Supabase project.
                </p>
              </div>
            </section>

            {/* Step 4 */}
            <section className="mb-10">
              <div className="flex items-start gap-4 mb-3">
                <div className="shrink-0 w-7 h-7 rounded-full border border-sand-200 flex items-center justify-center text-xs font-medium text-sand-500">
                  4
                </div>
                <h2 className="text-xl font-semibold text-sand-900">
                  Review findings and fix issues
                </h2>
              </div>
              <div className="ml-11">
                <p className="text-sand-500 text-sm leading-relaxed mb-3">
                  After the scan completes (typically under 40 seconds), you will
                  see:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-sand-500 mb-4">
                  <li>
                    An <strong className="text-sand-700">A-F security grade</strong> for
                    your project
                  </li>
                  <li>
                    A breakdown of findings by severity (critical, high, medium,
                    low)
                  </li>
                  <li>
                    Detailed remediation for each finding, including{" "}
                    <strong className="text-sand-700">copy-paste SQL fixes</strong> you
                    can run directly in the Supabase SQL editor
                  </li>
                </ul>
                <div className="bg-white border border-sand-200 rounded-lg p-4 text-sm">
                  <p className="text-sand-700 font-medium mb-1">
                    Severity levels
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-sand-500">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Critical -- immediate action required
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      High -- fix before deploying to production
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Medium -- should be addressed soon
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Low -- improvement recommended
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Next steps */}
            <section className="mt-14 pt-8 border-t border-sand-200">
              <h2 className="text-lg font-semibold text-sand-900 mb-4">
                Next steps
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <a
                  href="/docs/cli"
                  className="block border border-sand-200 rounded-lg p-5 bg-white hover:border-sand-300 transition-colors group"
                >
                  <p className="text-sm font-semibold text-sand-900 mb-1 group-hover:text-sand-700">
                    CLI
                  </p>
                  <p className="text-xs text-sand-500">
                    Run scans from the terminal with configuration files and
                    output formats.
                  </p>
                </a>
                <a
                  href="/docs/github-action"
                  className="block border border-sand-200 rounded-lg p-5 bg-white hover:border-sand-300 transition-colors group"
                >
                  <p className="text-sm font-semibold text-sand-900 mb-1 group-hover:text-sand-700">
                    GitHub Action
                  </p>
                  <p className="text-xs text-sand-500">
                    Automate scans in CI/CD with PR comments and threshold
                    gating.
                  </p>
                </a>
                <a
                  href="/docs/api"
                  className="block border border-sand-200 rounded-lg p-5 bg-white hover:border-sand-300 transition-colors group"
                >
                  <p className="text-sm font-semibold text-sand-900 mb-1 group-hover:text-sand-700">
                    API Reference
                  </p>
                  <p className="text-xs text-sand-500">
                    Submit scans and retrieve results programmatically via the
                    REST API.
                  </p>
                </a>
                <a
                  href="/docs/scanner-core"
                  className="block border border-sand-200 rounded-lg p-5 bg-white hover:border-sand-300 transition-colors group"
                >
                  <p className="text-sm font-semibold text-sand-900 mb-1 group-hover:text-sand-700">
                    Scanner Core
                  </p>
                  <p className="text-xs text-sand-500">
                    Use @supascanner/core for programmatic scanning and custom
                    integrations.
                  </p>
                </a>
                <a
                  href="/docs/badge"
                  className="block border border-sand-200 rounded-lg p-5 bg-white hover:border-sand-300 transition-colors group"
                >
                  <p className="text-sm font-semibold text-sand-900 mb-1 group-hover:text-sand-700">
                    Badge
                  </p>
                  <p className="text-xs text-sand-500">
                    Embed a live security grade badge in your README or
                    website.
                  </p>
                </a>
                <a
                  href="/security-checklist"
                  className="block border border-sand-200 rounded-lg p-5 bg-white hover:border-sand-300 transition-colors group"
                >
                  <p className="text-sm font-semibold text-sand-900 mb-1 group-hover:text-sand-700">
                    Security Checklist
                  </p>
                  <p className="text-xs text-sand-500">
                    43-point interactive checklist for manual security review.
                  </p>
                </a>
              </div>
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
