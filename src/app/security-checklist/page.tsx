import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo/config";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SecurityChecklistInteractive } from "@/components/security-checklist";

export const metadata: Metadata = {
  title: "The Complete Supabase Security Checklist 2026 | SupaScanner",
  description:
    "43-point interactive Supabase security checklist covering RLS, API keys, storage, auth, database functions, and edge functions. Track your progress and automate every check.",
  keywords: [
    "supabase security checklist",
    "supabase security best practices",
    "supabase RLS guide",
    "supabase row level security",
    "supabase storage security",
    "supabase auth hardening",
    "supabase edge functions security",
  ],
  alternates: {
    canonical: `${siteConfig.url}/security-checklist`,
  },
  openGraph: {
    title: "The Complete Supabase Security Checklist 2026",
    description:
      "43-point interactive checklist for securing your Supabase project. Covers RLS, API keys, storage, auth, functions, and more.",
    url: `${siteConfig.url}/security-checklist`,
    type: "website",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "The Complete Supabase Security Checklist 2026",
    description:
      "43-point interactive checklist for securing your Supabase project. Track your progress and automate every check with SupaScanner.",
  },
};

export default function SecurityChecklist() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <nav className="mb-12 flex items-center justify-between">
          <a
            href="/"
            className="text-base font-semibold tracking-tight text-sand-900"
          >
            SupaScanner
          </a>
          <div className="flex items-center gap-6">
            <a
              href="/blog"
              className="text-sm text-sand-500 hover:text-sand-900 transition-colors"
            >
              Blog
            </a>
            <a
              href="/pricing"
              className="text-sm text-sand-500 hover:text-sand-900 transition-colors"
            >
              Pricing
            </a>
            <a
              href="/login"
              className="text-sm px-4 py-2 bg-sand-900 hover:bg-sand-700 text-white font-medium rounded-lg transition-colors"
            >
              Sign in
            </a>
          </div>
        </nav>

        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Security Checklist", href: "/security-checklist" },
          ]}
        />

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 text-sand-900">
          The Complete Supabase Security Checklist
        </h1>
        <p className="text-sand-500 text-lg mb-4 leading-relaxed">
          43 actionable security checks across 7 critical areas. Check off each
          item as you review your Supabase project, or{" "}
          <a
            href="/login"
            className="text-sand-900 font-medium hover:text-sand-600 transition-colors underline"
          >
            automate these checks with a free scan
          </a>
          .
        </p>
        <p className="text-sand-400 text-sm mb-8">
          Your progress is saved locally in your browser. Enter your email to
          receive a copy and security tips.
        </p>

        <SecurityChecklistInteractive />

        <footer className="mt-16 pt-8 border-t border-sand-200 text-center text-xs text-sand-400">
          SupaScanner. Your credentials are never persisted.
        </footer>
      </div>
    </main>
  );
}
