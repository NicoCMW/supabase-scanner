import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo/config";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Acceptable Use Policy",
  description:
    "Acceptable use policy for the SupaScanner security scanning service.",
  alternates: {
    canonical: `${siteConfig.url}/acceptable-use`,
  },
};

export default function AcceptableUsePage() {
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
          Acceptable Use Policy
        </h1>
        <p className="text-sand-400 text-sm mb-10">
          Last updated: March 30, 2026
        </p>

        <div className="space-y-8 text-sand-600 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              1. Purpose
            </h2>
            <p>
              This Acceptable Use Policy (&quot;AUP&quot;) defines the permitted
              and prohibited uses of SupaScanner (&quot;the Service&quot;). By
              using the Service, you agree to comply with this policy. This AUP
              supplements our{" "}
              <a href="/terms" className="underline hover:text-sand-900">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="underline hover:text-sand-900">
                Privacy Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              2. Permitted Use
            </h2>
            <p className="mb-3">
              SupaScanner is designed to help you identify security
              misconfigurations in Supabase projects that you own or have
              explicit authorization to test. Permitted uses include:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Scanning Supabase projects you own or administer.
              </li>
              <li>
                Scanning projects for which the owner has granted you written
                authorization to perform security testing.
              </li>
              <li>
                Using scan results to improve the security posture of authorized
                projects.
              </li>
              <li>
                Integrating scan results into your internal security workflows
                and reporting.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              3. Prohibited Uses
            </h2>
            <p className="mb-3">You must not use the Service to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Scan Supabase projects you do not own or have explicit
                authorization to test.
              </li>
              <li>
                Conduct any form of unauthorized security testing, penetration
                testing, or vulnerability assessment against third-party
                systems.
              </li>
              <li>
                Attempt to exploit, attack, or compromise any system using
                information obtained from scan results.
              </li>
              <li>
                Distribute, sell, or publicly disclose vulnerabilities discovered
                in third-party projects without proper authorization and
                responsible disclosure.
              </li>
              <li>
                Reverse engineer, decompile, disassemble, or attempt to derive
                the source code of the Service.
              </li>
              <li>
                Scrape, crawl, or use automated tools to extract data from the
                Service beyond its intended API and interface.
              </li>
              <li>
                Interfere with or disrupt the Service, its servers, or the
                networks connected to it, including denial-of-service attacks.
              </li>
              <li>
                Use the Service for any activity that violates applicable local,
                state, national, or international law.
              </li>
              <li>
                Resell, redistribute, or sublicense access to the Service
                without our prior written consent.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              4. Rate Limiting and Fair Use
            </h2>
            <p>
              The Service enforces rate limits to ensure fair access for all
              users. Free-tier accounts are limited to 3 scans per month. Pro
              accounts have higher limits but are still subject to fair-use
              policies. You must not attempt to circumvent, bypass, or override
              rate limits through any means, including but not limited to
              creating multiple accounts, rotating credentials, or using
              automated scripts to exceed your allocated usage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              5. Account Responsibilities
            </h2>
            <p className="mb-3">As an account holder, you are responsible for:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Maintaining the security and confidentiality of your account
                credentials.
              </li>
              <li>
                All activity that occurs under your account, whether or not you
                authorized it.
              </li>
              <li>
                Ensuring that anyone who uses the Service through your account
                complies with this AUP.
              </li>
              <li>
                Notifying us immediately at abuse@supascanner.com if you become
                aware of any unauthorized use of your account.
              </li>
              <li>
                Only providing Supabase credentials (project URL and anon key)
                for projects you are authorized to scan.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              6. Enforcement and Termination
            </h2>
            <p className="mb-3">
              We reserve the right to investigate and take action against any
              violations of this AUP. Enforcement actions may include, at our
              sole discretion:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Issuing a warning and requesting immediate compliance.
              </li>
              <li>
                Temporarily suspending your account and access to the Service.
              </li>
              <li>
                Permanently terminating your account without refund.
              </li>
              <li>
                Reporting illegal activity to appropriate law enforcement
                authorities.
              </li>
              <li>
                Pursuing legal remedies, including injunctive relief and damages.
              </li>
            </ul>
            <p className="mt-3">
              We may take any of these actions without prior notice when we
              reasonably believe the violation poses an immediate risk to the
              Service, its users, or third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              7. Reporting Violations
            </h2>
            <p>
              If you become aware of any violation of this AUP, please report it
              to us at abuse@supascanner.com. Include as much detail as possible,
              including the nature of the violation, the account involved (if
              known), and any supporting evidence. We will investigate all
              reports in a timely manner and take appropriate action.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              8. Changes to This Policy
            </h2>
            <p>
              We may update this Acceptable Use Policy from time to time. We
              will notify you of any material changes by posting the updated
              policy on this page with a revised &quot;Last updated&quot; date.
              Continued use of the Service after changes constitutes acceptance
              of the modified policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-sand-900 mb-3">
              9. Contact Us
            </h2>
            <p>
              If you have questions about this Acceptable Use Policy, please
              contact us at abuse@supascanner.com.
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
          <a
            href="/acceptable-use"
            className="hover:text-sand-600 transition-colors"
          >
            Acceptable Use
          </a>
        </footer>
      </div>
    </main>
  );
}
