import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how SupaScanner collects, uses, and protects your information.",
  alternates: {
    canonical: `${siteConfig.url}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <nav className="mb-16">
          <a
            href="/"
            className="text-base font-semibold tracking-tight text-sand-900"
          >
            SupaScanner
          </a>
        </nav>

        <h1 className="text-3xl font-semibold mb-2 text-sand-900">
          Privacy Policy
        </h1>
        <p className="text-sand-400 text-sm mb-10">
          Last updated: March 28, 2026
        </p>

        <div className="space-y-8 text-sand-600 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              1. Introduction
            </h2>
            <p>
              SupaScanner (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;)
              operates the website at supabase-scanner.vercel.app. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your
              information when you visit our website and use our security
              scanning service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              2. Information We Collect
            </h2>
            <p className="mb-3">
              We collect information you provide directly to us:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Account information:</strong> your email address when you
                sign up or log in via magic link.
              </li>
              <li>
                <strong>Scan inputs:</strong> your Supabase project URL and anon
                key, provided when you initiate a scan. These credentials are
                used only for the duration of the scan and are never persisted on
                our servers.
              </li>
              <li>
                <strong>Usage data:</strong> pages visited, features used, scan
                frequency, and interaction patterns collected through analytics
                tools.
              </li>
              <li>
                <strong>Payment information:</strong> if you subscribe to a paid
                plan, payment is processed by Stripe. We do not store credit card
                numbers or bank details.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To provide, maintain, and improve our security scanning service.</li>
              <li>To process your transactions and manage your subscription.</li>
              <li>To send you transactional emails (scan results, account notifications).</li>
              <li>To send you product updates and feature announcements, which you can opt out of at any time.</li>
              <li>To analyze usage patterns and improve user experience.</li>
              <li>To detect, prevent, and address technical issues.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              4. Credential Handling
            </h2>
            <p>
              Your Supabase project URL and anon key are transmitted over HTTPS,
              used exclusively to perform the requested scan, and discarded
              immediately after the scan completes. We do not store, log, or
              share your credentials. Scan result summaries (security grade,
              finding counts) are stored in your account for scan history, but
              the original credentials are never retained.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              5. Data Sharing
            </h2>
            <p>We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>
                <strong>Service providers:</strong> Supabase (authentication and
                database), Stripe (payments), Vercel (hosting), and analytics
                providers, each bound by their own privacy policies.
              </li>
              <li>
                <strong>Legal requirements:</strong> when required by law,
                subpoena, or to protect our rights.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              6. Cookies and Analytics
            </h2>
            <p>
              We use cookies and similar tracking technologies to maintain your
              session, remember preferences, and collect anonymized analytics
              data via Google Analytics and Vercel Analytics. You can control
              cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              7. Data Retention
            </h2>
            <p>
              We retain your account data for as long as your account is active.
              Scan history is retained for your reference until you delete your
              account. You may request deletion of your account and associated
              data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              8. Your Rights (GDPR)
            </h2>
            <p>If you are located in the European Economic Area, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Access and receive a copy of your personal data.</li>
              <li>Rectify inaccurate personal data.</li>
              <li>Request deletion of your personal data.</li>
              <li>Object to or restrict processing of your personal data.</li>
              <li>Data portability.</li>
              <li>Withdraw consent at any time.</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, contact us at the email below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              9. Security
            </h2>
            <p>
              We implement appropriate technical and organizational measures to
              protect your information, including encryption in transit (TLS),
              secure authentication via Supabase Auth, and regular security
              reviews. However, no method of transmission over the Internet is
              100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              10. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify
              you of any material changes by posting the updated policy on this
              page with a revised &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              11. Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy, please contact us
              at privacy@supascanner.com.
            </p>
          </section>
        </div>

        <footer className="mt-16 pt-8 border-t border-sand-200 text-center text-xs text-sand-400 flex items-center justify-center gap-4">
          <span>SupaScanner</span>
          <a href="/privacy" className="hover:text-sand-600 transition-colors">
            Privacy Policy
          </a>
          <a href="/terms" className="hover:text-sand-600 transition-colors">
            Terms of Service
          </a>
        </footer>
      </div>
    </main>
  );
}
