import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms and conditions for using the SupaScanner security scanning service.",
  alternates: {
    canonical: `${siteConfig.url}/terms`,
  },
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-sand-400 text-sm mb-10">
          Last updated: March 28, 2026
        </p>

        <div className="space-y-8 text-sand-600 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using SupaScanner (&quot;the Service&quot;), you
              agree to be bound by these Terms of Service. If you do not agree to
              these terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              2. Description of Service
            </h2>
            <p>
              SupaScanner is a security scanning tool that analyzes Supabase
              projects for Row Level Security gaps, storage bucket
              misconfigurations, and authentication issues. The Service performs
              read-only checks and does not modify your Supabase project in any
              way.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              3. Account Registration
            </h2>
            <p>
              You must provide a valid email address to create an account. You
              are responsible for maintaining the confidentiality of your account
              and for all activities that occur under your account. You agree to
              notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              4. Acceptable Use
            </h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Use the Service to scan Supabase projects you do not own or have
                explicit authorization to test.
              </li>
              <li>
                Attempt to circumvent rate limits or usage restrictions.
              </li>
              <li>
                Reverse engineer, decompile, or disassemble any part of the
                Service.
              </li>
              <li>
                Use the Service for any illegal purpose or in violation of any
                applicable laws.
              </li>
              <li>
                Resell, redistribute, or sublicense access to the Service
                without our written consent.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              5. Subscription and Billing
            </h2>
            <p>
              The Service offers a free tier with limited scans per month and a
              paid Pro tier with unlimited scans. Paid subscriptions are billed
              monthly through Stripe. You may cancel your subscription at any
              time through the billing portal. Cancellations take effect at the
              end of the current billing period. We do not offer refunds for
              partial billing periods.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              6. Credential Handling
            </h2>
            <p>
              You provide your Supabase project URL and anon key to initiate
              scans. These credentials are transmitted securely over HTTPS, used
              only for the duration of the scan, and immediately discarded
              afterward. We do not store your credentials. You acknowledge that
              the anon key is a public key intended for client-side use and does
              not grant administrative access to your project.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              7. Disclaimer of Warranties
            </h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as
              available&quot; without warranties of any kind, whether express or
              implied. We do not warrant that scan results are complete,
              accurate, or sufficient to secure your Supabase project. The
              Service is a supplementary tool and does not replace a
              comprehensive security audit by qualified professionals.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              8. Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by law, SupaScanner and its
              operators shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, or any loss of
              profits, data, or goodwill arising out of or in connection with
              your use of the Service, even if advised of the possibility of
              such damages. Our total liability shall not exceed the amount you
              paid us in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              9. Indemnification
            </h2>
            <p>
              You agree to indemnify and hold harmless SupaScanner, its
              operators, and affiliates from any claims, damages, or expenses
              arising from your use of the Service, your violation of these
              Terms, or your violation of any rights of a third party.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              10. Termination
            </h2>
            <p>
              We may terminate or suspend your access to the Service at any time,
              with or without cause, with or without notice. Upon termination,
              your right to use the Service ceases immediately. Provisions that
              by their nature should survive termination will survive,
              including warranty disclaimers, indemnification, and limitations of
              liability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              11. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. We will
              notify you of material changes by posting the updated terms on this
              page with a revised &quot;Last updated&quot; date. Continued use of
              the Service after changes constitutes acceptance of the modified
              terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              12. Governing Law
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with
              applicable law, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              13. Contact Us
            </h2>
            <p>
              If you have questions about these Terms of Service, please contact
              us at legal@supascanner.com.
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
