import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo/config";
import { WaitlistForm } from "@/components/waitlist-form";
import { LiveStats } from "@/components/live-stats";
import { SiteHeader } from "@/components/site-header";
import { ExperimentTracker } from "@/components/experiment-tracker";
import { getVariant, getAllVariants } from "@/lib/ab-testing/server";

export const metadata: Metadata = {
  title: "SupaScanner - Find RLS Gaps Before Your Users Do",
  description: siteConfig.description,
  alternates: {
    canonical: siteConfig.url,
  },
};

const HERO_HEADLINES = {
  security: {
    line1: "Find RLS gaps before",
    line2: "your users do",
  },
  speed: {
    line1: "40-second security scan",
    line2: "for your Supabase project",
  },
  compliance: {
    line1: "Ship compliant apps",
    line2: "without the audit anxiety",
  },
} as const;

const CTA_LABELS = {
  scan_now_free: "Scan now free",
  check_security: "Check your security",
  get_score: "Get your security score",
} as const;

export default async function Home() {
  const [heroVariant, ctaVariant, socialProofVariant, assignments] =
    await Promise.all([
      getVariant("hero_headline"),
      getVariant("cta_text"),
      getVariant("social_proof_placement"),
      getAllVariants(),
    ]);

  const headline = HERO_HEADLINES[heroVariant];
  const ctaLabel = CTA_LABELS[ctaVariant];
  const showSocialProofAboveFold = socialProofVariant === "above_fold";
  const showSocialProofSidebar = socialProofVariant === "sidebar";

  return (
    <main className="min-h-screen" id="main-content">
      <SiteHeader />
      <ExperimentTracker assignments={assignments} />

      <section className="px-8 pt-28 pb-24 max-w-3xl mx-auto text-center">
        <p className="text-sm text-sand-400 tracking-wide uppercase mb-6">
          Non-destructive security scanning
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.15] mb-6 text-sand-900">
          {headline.line1}
          <br />
          {headline.line2}
        </h1>
        <p className="text-sand-500 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Paste your Supabase URL and anon key. In under 40 seconds you get a
          security grade, a list of every misconfigured table, bucket, and auth
          setting, plus SQL fixes you can copy straight into the editor.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a
            href="/login"
            className="px-7 py-2.5 bg-sand-900 hover:bg-sand-700 text-white font-medium rounded-lg transition-colors text-sm"
          >
            {ctaLabel}
          </a>
          <a
            href="#how-it-works"
            className="px-7 py-2.5 border border-sand-200 hover:border-sand-300 text-sand-600 font-medium rounded-lg transition-colors text-sm"
          >
            How it works
          </a>
        </div>
        <p className="mt-5 text-xs text-sand-400">
          3 free scans per month. No credit card required.
        </p>
        <div className="mt-10 pt-8 border-t border-sand-200">
          <p className="text-sm text-sand-500 mb-3">
            Not ready to scan yet? Get notified when we launch new features.
          </p>
          <WaitlistForm />
        </div>
      </section>

      {showSocialProofAboveFold && <LiveStats />}

      {showSocialProofSidebar ? (
        <div className="max-w-6xl mx-auto px-8 grid lg:grid-cols-[1fr_280px] gap-8">
          <div>
            <FeaturesSection />
            <HowItWorksSection />
          </div>
          <aside className="hidden lg:block pt-20">
            <div className="sticky top-8">
              <LiveStats compact />
            </div>
          </aside>
        </div>
      ) : (
        <>
          {!showSocialProofAboveFold && <LiveStats />}
          <FeaturesSection />
          <HowItWorksSection />
        </>
      )}

      <section className="px-8 py-20 max-w-3xl mx-auto text-center border-t border-sand-200">
        <h2 className="text-2xl font-semibold mb-3 text-sand-900">
          Simple pricing
        </h2>
        <p className="text-sand-500 mb-10 max-w-md mx-auto text-sm">
          Start scanning for free. Upgrade when you need unlimited access.
        </p>
        <div className="grid sm:grid-cols-2 gap-5 max-w-xl mx-auto">
          <div className="border border-sand-200 rounded-xl p-7 text-left bg-white">
            <h3 className="font-semibold mb-1 text-sand-900">Free</h3>
            <div className="text-3xl font-semibold mb-4 text-sand-900">
              $0
              <span className="text-base font-normal text-sand-400">/mo</span>
            </div>
            <ul className="text-sm text-sand-500 space-y-2">
              <li>3 scans per month</li>
              <li>All audit modules</li>
              <li>AI fix suggestions</li>
            </ul>
          </div>
          <div className="border border-sand-900 rounded-xl p-7 text-left bg-white">
            <h3 className="font-semibold mb-1 text-sand-900">Pro</h3>
            <div className="text-3xl font-semibold mb-4 text-sand-900">
              $29
              <span className="text-base font-normal text-sand-400">/mo</span>
            </div>
            <ul className="text-sm text-sand-500 space-y-2">
              <li>Unlimited scans</li>
              <li>All audit modules</li>
              <li>AI fix suggestions</li>
              <li>Priority support</li>
            </ul>
          </div>
        </div>
        <a
          href="/login"
          className="inline-block mt-10 px-7 py-2.5 bg-sand-900 hover:bg-sand-700 text-white font-medium rounded-lg transition-colors text-sm"
        >
          Get started free
        </a>
      </section>

      <footer className="px-8 py-8 max-w-5xl mx-auto border-t border-sand-200 text-center text-xs text-sand-400">
        <p className="mb-2">SupaScanner. Your credentials are never persisted.</p>
        <div className="flex items-center justify-center gap-4">
          <a href="/docs" className="hover:text-sand-600 transition-colors">
            Documentation
          </a>
          <a href="/privacy" className="hover:text-sand-600 transition-colors">
            Privacy Policy
          </a>
          <a href="/terms" className="hover:text-sand-600 transition-colors">
            Terms of Service
          </a>
          <a
            href="/acceptable-use"
            className="hover:text-sand-600 transition-colors"
          >
            Acceptable Use
          </a>
        </div>
      </footer>
    </main>
  );
}

function FeaturesSection() {
  return (
    <section className="px-8 py-20 max-w-5xl mx-auto">
      <h2 className="text-2xl font-semibold text-center mb-3 text-sand-900">
        Three audits, one scan
      </h2>
      <p className="text-sand-500 text-center mb-14 max-w-lg mx-auto text-sm leading-relaxed">
        Every scan runs all three modules against your project. Nothing is
        written or modified -- every check is read-only.
      </p>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="border border-sand-200 rounded-xl p-7 bg-white">
          <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center mb-5 text-red-600 font-semibold text-xs">
            RLS
          </div>
          <h3 className="text-base font-semibold mb-2 text-sand-900">
            Row Level Security
          </h3>
          <p className="text-sand-500 text-sm leading-relaxed">
            Discovers every table via the OpenAPI schema, then probes each one
            with the anon key. Flags tables that return data without
            authentication or allow anonymous inserts.
          </p>
        </div>
        <div className="border border-sand-200 rounded-xl p-7 bg-white">
          <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center mb-5 text-amber-600 font-semibold text-xs">
            STR
          </div>
          <h3 className="text-base font-semibold mb-2 text-sand-900">
            Storage Buckets
          </h3>
          <p className="text-sand-500 text-sm leading-relaxed">
            Lists every bucket and checks for public access, open directory
            listing, and anonymous upload permissions that could expose files
            or let attackers store arbitrary content.
          </p>
        </div>
        <div className="border border-sand-200 rounded-xl p-7 bg-white">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center mb-5 text-blue-600 font-semibold text-xs">
            AUTH
          </div>
          <h3 className="text-base font-semibold mb-2 text-sand-900">
            Auth Configuration
          </h3>
          <p className="text-sand-500 text-sm leading-relaxed">
            Checks whether email confirmation is enforced, whether auth
            settings are exposed to unauthenticated users, and flags common
            misconfigurations that weaken account security.
          </p>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="px-8 py-20 max-w-3xl mx-auto border-t border-sand-200"
    >
      <h2 className="text-2xl font-semibold text-center mb-14 text-sand-900">
        How it works
      </h2>
      <div className="space-y-10">
        <div className="flex items-start gap-5">
          <div className="shrink-0 w-8 h-8 rounded-full border border-sand-200 flex items-center justify-center text-sm font-medium text-sand-500">
            1
          </div>
          <div>
            <h3 className="text-base font-semibold mb-1 text-sand-900">
              Enter your project URL and anon key
            </h3>
            <p className="text-sand-500 text-sm leading-relaxed">
              Both values are in your Supabase dashboard under Settings &gt;
              API. The anon key is safe to share -- it is the public key your
              frontend already uses.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-5">
          <div className="shrink-0 w-8 h-8 rounded-full border border-sand-200 flex items-center justify-center text-sm font-medium text-sand-500">
            2
          </div>
          <div>
            <h3 className="text-base font-semibold mb-1 text-sand-900">
              We scan, read-only
            </h3>
            <p className="text-sand-500 text-sm leading-relaxed">
              The scanner runs all three audit modules in parallel. It only
              performs GET requests and anonymous access checks. Nothing is
              written, deleted, or modified in your project.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-5">
          <div className="shrink-0 w-8 h-8 rounded-full border border-sand-200 flex items-center justify-center text-sm font-medium text-sand-500">
            3
          </div>
          <div>
            <h3 className="text-base font-semibold mb-1 text-sand-900">
              Get your report with copy-paste fixes
            </h3>
            <p className="text-sand-500 text-sm leading-relaxed">
              You receive an A-F security grade, a breakdown of every finding
              by severity, and AI-generated SQL and config snippets you can
              apply immediately in the Supabase SQL editor.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
