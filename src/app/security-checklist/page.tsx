import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo/config";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = {
  title: "Supabase Security Checklist 2026",
  description:
    "The complete Supabase security checklist: RLS, API keys, storage policies, auth hardening, and more. Automate every check with SupaScanner.",
  alternates: {
    canonical: `${siteConfig.url}/security-checklist`,
  },
  openGraph: {
    title: "Supabase Security Checklist 2026",
    description:
      "The complete Supabase security checklist. Automate every check with SupaScanner.",
    url: `${siteConfig.url}/security-checklist`,
    type: "website",
  },
};

const checklist = [
  {
    section: "Row Level Security",
    items: [
      "Enable RLS on every table that stores user data",
      "Create SELECT, INSERT, UPDATE, and DELETE policies per table",
      "Use auth.uid() in policy expressions for user-scoped access",
      "Test policies with different user roles before deploying",
      "Audit views for SECURITY DEFINER leaks that bypass RLS",
    ],
  },
  {
    section: "API Key Management",
    items: [
      "Never expose the service_role key in client-side code",
      "Use the anon key only in combination with RLS",
      "Rotate keys periodically and after any suspected exposure",
      "Store keys in environment variables, never in source code",
    ],
  },
  {
    section: "Storage Buckets",
    items: [
      "Set buckets to private unless public access is intentional",
      "Create storage RLS policies for upload and download",
      "Restrict anonymous uploads to prevent abuse",
      "Audit bucket listing permissions",
    ],
  },
  {
    section: "Authentication",
    items: [
      "Enable email confirmation for new signups",
      "Configure MFA (TOTP) for sensitive applications",
      "Set strong password policies",
      "Review OAuth provider configurations",
      "Set appropriate session token lifetimes",
    ],
  },
  {
    section: "General Hardening",
    items: [
      "Disable Realtime on tables that do not need it",
      "Review edge function permissions and secrets",
      "Enable database audit logging",
      "Set up monitoring and alerting for suspicious activity",
    ],
  },
] as const;

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
          Supabase Security Checklist
        </h1>
        <p className="text-sand-500 text-lg mb-12 leading-relaxed">
          A comprehensive checklist for securing your Supabase project. Run
          through each section or{" "}
          <a
            href="/login"
            className="text-sand-900 font-medium hover:text-sand-600 transition-colors underline"
          >
            automate these checks with a free scan
          </a>
          .
        </p>

        <div className="space-y-10">
          {checklist.map((section) => (
            <section key={section.section}>
              <h2 className="text-xl font-semibold mb-4 text-sand-900">
                {section.section}
              </h2>
              <ul className="space-y-3">
                {section.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <span className="shrink-0 mt-0.5 w-5 h-5 border border-sand-300 rounded flex items-center justify-center text-sand-300">
                      &nbsp;
                    </span>
                    <span className="text-sand-600">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <aside className="mt-16 pt-8 border-t border-sand-200 text-center">
          <h2 className="text-xl font-semibold mb-2 text-sand-900">
            Automate this checklist
          </h2>
          <p className="text-sand-500 text-sm mb-5 max-w-md mx-auto">
            SupaScanner checks your project against these items automatically
            and gives you copy-paste SQL fixes.
          </p>
          <a
            href="/login"
            className="inline-block px-7 py-2.5 bg-sand-900 hover:bg-sand-700 text-white font-medium rounded-lg transition-colors text-sm"
          >
            Start free scan
          </a>
        </aside>
      </div>
    </main>
  );
}
