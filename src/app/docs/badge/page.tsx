import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo/config";
import { SiteHeader } from "@/components/site-header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DocsNav } from "@/components/docs-nav";

export const metadata: Metadata = {
  title: "Badge Documentation | SupaScanner",
  description:
    "Embed a live security grade badge in your README or website. Shows your latest SupaScanner grade and updates automatically after each scan.",
  keywords: [
    "supascanner badge",
    "supabase security badge",
    "supabase security grade badge",
    "supascanner README badge",
    "supabase security shield",
  ],
  alternates: {
    canonical: `${siteConfig.url}/docs/badge`,
  },
  openGraph: {
    title: "Badge Documentation - SupaScanner",
    description:
      "Embed a live security grade badge in your README or website.",
    url: `${siteConfig.url}/docs/badge`,
    type: "website",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Badge Documentation - SupaScanner",
    description:
      "Embed a live SupaScanner security grade badge in your README.",
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

export default function DocsBadgePage() {
  return (
    <main className="min-h-screen" id="main-content">
      <SiteHeader />

      <div className="px-8 pt-12 pb-24 max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Docs", href: "/docs" },
            { label: "Badge", href: "/docs/badge" },
          ]}
        />

        <div className="md:flex md:gap-12">
          <DocsNav currentPath="/docs/badge" />

          <article className="min-w-0 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 text-sand-900">
              Badge
            </h1>
            <p className="text-sand-500 text-lg mb-10 leading-relaxed">
              Display your latest security grade as a badge in your README,
              documentation, or website. The badge updates automatically after
              each scan.
            </p>

            {/* How it works */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                How it works
              </h2>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                After sharing a scan result, you get a{" "}
                <code className="bg-sand-100 px-1.5 py-0.5 rounded text-sand-700 text-xs">
                  shareId
                </code>{" "}
                (also called{" "}
                <code className="bg-sand-100 px-1.5 py-0.5 rounded text-sand-700 text-xs">
                  projectId
                </code>
                ) that you can use to generate a badge URL:
              </p>
              <CodeBlock>{`https://supascanner.com/api/badge/<your-share-id>`}</CodeBlock>
              <p className="text-sand-500 text-sm leading-relaxed">
                The badge is an SVG image served with a 24-hour cache. It shows
                your project name label and the latest security grade with a
                color-coded background.
              </p>
            </section>

            {/* Getting your share ID */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Getting your share ID
              </h2>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                Share a scan result using the API or the dashboard share button:
              </p>
              <CodeBlock title="curl">{`curl -X POST https://supascanner.com/api/share \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"scanJobId": "<your-scan-job-id>"}'

# Response:
# {"shareId": "abcd-efgh-ijkl"}`}</CodeBlock>
              <p className="text-sand-500 text-sm leading-relaxed">
                Use the returned{" "}
                <code className="bg-sand-100 px-1.5 py-0.5 rounded text-sand-700 text-xs">
                  shareId
                </code>{" "}
                in the badge URL.
              </p>
            </section>

            {/* Embedding */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Embedding the badge
              </h2>

              <h3 className="text-base font-semibold text-sand-900 mb-2">
                Markdown (GitHub README)
              </h3>
              <CodeBlock title="README.md">{`![SupaScanner Grade](https://supascanner.com/api/badge/<share-id>)`}</CodeBlock>

              <h3 className="text-base font-semibold text-sand-900 mb-2 mt-6">
                HTML
              </h3>
              <CodeBlock title="HTML">{`<img
  src="https://supascanner.com/api/badge/<share-id>"
  alt="SupaScanner Security Grade"
/>`}</CodeBlock>

              <h3 className="text-base font-semibold text-sand-900 mb-2 mt-6">
                Link to results
              </h3>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                Wrap the badge in a link to your public results page:
              </p>
              <CodeBlock title="README.md">{`[![SupaScanner Grade](https://supascanner.com/api/badge/<share-id>)](https://supascanner.com/results/<share-id>)`}</CodeBlock>
            </section>

            {/* Query parameters */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Customization
              </h2>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                Customize the badge appearance with query parameters:
              </p>
              <div className="border border-sand-200 rounded-lg overflow-hidden bg-white text-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sand-200 bg-sand-50">
                      <th className="text-left px-4 py-2 font-medium text-sand-700">
                        Parameter
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
                        style
                      </td>
                      <td className="px-4 py-2">
                        <code className="text-xs">flat</code>
                      </td>
                      <td className="px-4 py-2">
                        Badge style:{" "}
                        <code className="text-xs">flat</code> or{" "}
                        <code className="text-xs">flat-square</code>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs text-sand-700">
                        label
                      </td>
                      <td className="px-4 py-2">
                        <code className="text-xs">SupaScanner</code>
                      </td>
                      <td className="px-4 py-2">
                        Custom label text on the left side of the badge
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <CodeBlock title="Custom label and style">{`https://supascanner.com/api/badge/<share-id>?style=flat-square&label=Security`}</CodeBlock>
            </section>

            {/* Badge with GitHub Action */}
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-sand-900 mb-4">
                Keeping the badge current
              </h2>
              <p className="text-sand-500 text-sm leading-relaxed mb-3">
                The badge automatically reflects your latest shared scan. To
                keep it current, run scans regularly using:
              </p>
              <ul className="list-disc list-inside text-sm text-sand-500 space-y-1.5 mb-4">
                <li>
                  The{" "}
                  <a
                    href="/docs/github-action"
                    className="text-sand-900 font-medium underline hover:text-sand-600 transition-colors"
                  >
                    GitHub Action
                  </a>{" "}
                  on every push or PR
                </li>
                <li>
                  Scheduled scans via the{" "}
                  <a
                    href="/docs/api"
                    className="text-sand-900 font-medium underline hover:text-sand-600 transition-colors"
                  >
                    API
                  </a>{" "}
                  or dashboard
                </li>
                <li>
                  The{" "}
                  <a
                    href="/docs/cli"
                    className="text-sand-900 font-medium underline hover:text-sand-600 transition-colors"
                  >
                    CLI
                  </a>{" "}
                  in a cron job
                </li>
              </ul>
              <div className="bg-white border border-sand-200 rounded-lg p-4 text-sm text-sand-500">
                <p>
                  The badge SVG is cached for 24 hours. After running a new scan
                  and sharing the result, the badge will update within an hour.
                </p>
              </div>
            </section>

            {/* Navigation */}
            <section className="mt-14 pt-8 border-t border-sand-200 flex items-center justify-between">
              <a
                href="/docs/scanner-core"
                className="text-sm text-sand-500 hover:text-sand-900 transition-colors"
              >
                &larr; Scanner Core
              </a>
              <a
                href="/docs"
                className="text-sm text-sand-500 hover:text-sand-900 transition-colors"
              >
                Quick Start &rarr;
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
