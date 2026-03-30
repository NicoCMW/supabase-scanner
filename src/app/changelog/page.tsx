import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo/config";
import { getAllChangelogEntries, type ChangelogCategory } from "@/lib/changelog";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "See what's new in SupaScanner. Product updates, new features, and improvements.",
  alternates: {
    canonical: `${siteConfig.url}/changelog`,
    types: {
      "application/rss+xml": `${siteConfig.url}/changelog.xml`,
    },
  },
  openGraph: {
    title: `Changelog | ${siteConfig.name}`,
    description:
      "See what's new in SupaScanner. Product updates, new features, and improvements.",
    url: `${siteConfig.url}/changelog`,
    type: "website",
  },
};

const categoryStyles: Record<ChangelogCategory, { label: string; className: string }> = {
  feature: {
    label: "Feature",
    className: "bg-sand-900 text-white",
  },
  improvement: {
    label: "Improvement",
    className: "bg-sand-200 text-sand-700",
  },
  fix: {
    label: "Fix",
    className: "bg-sand-100 text-sand-500",
  },
};

export default function ChangelogPage() {
  const entries = getAllChangelogEntries();

  return (
    <main className="min-h-screen" id="main-content">
      <SiteHeader links={[{ href: "/pricing", label: "Pricing" }]} />
      <div className="max-w-3xl mx-auto px-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Changelog", href: "/changelog" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-semibold text-sand-900">Changelog</h1>
          <a
            href="/changelog.xml"
            className="text-sm text-sand-400 hover:text-sand-900 transition-colors flex items-center gap-1.5"
            title="RSS Feed"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="3" cy="11" r="2" />
              <path d="M1 1a12 12 0 0 1 12 12h-3A9 9 0 0 0 1 4V1z" />
              <path d="M1 5a8 8 0 0 1 8 8H6A5 5 0 0 0 1 8V5z" />
            </svg>
            RSS
          </a>
        </div>
        <p className="text-sand-500 text-sm mb-12">
          Product updates, new features, and improvements.
        </p>

        <div className="space-y-0">
          {entries.map((entry, index) => {
            const style = categoryStyles[entry.category];
            return (
              <article
                key={entry.id}
                className={`py-8 ${index < entries.length - 1 ? "border-b border-sand-200" : ""}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <time
                    dateTime={entry.date}
                    className="text-xs text-sand-400 uppercase tracking-wide"
                  >
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.className}`}
                  >
                    {style.label}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-sand-900 mb-2">
                  {entry.title}
                </h2>
                <p className="text-sand-500 text-sm leading-relaxed">
                  {entry.description}
                </p>
                {entry.image && (
                  <img
                    src={entry.image}
                    alt={`Screenshot of ${entry.title}`}
                    className="mt-4 rounded-lg border border-sand-200"
                    loading="lazy"
                  />
                )}
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
