import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <span className="text-lg font-bold tracking-tight">
          SupaScanner
        </span>
        <div className="flex items-center gap-6">
          <a href="/pricing" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
            Pricing
          </a>
          <a
            href="/login"
            className="text-sm px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
          >
            Sign in
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 pt-24 pb-20 max-w-4xl mx-auto text-center">
        <div className="inline-block mb-6 px-3 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 rounded-full">
          Non-destructive security scanning for Supabase
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
          Find RLS gaps before<br />
          <span className="text-emerald-400">your users do</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Paste your Supabase URL and anon key. In under 40 seconds you get an
          A-F security grade, a list of every misconfigured table, bucket, and
          auth setting, plus AI-generated SQL fixes you can copy straight into
          the SQL editor.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a
            href="/login"
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors text-base"
          >
            Scan for Free
          </a>
          <a
            href="#how-it-works"
            className="px-8 py-3 border border-gray-700 hover:border-gray-500 text-gray-300 font-medium rounded-lg transition-colors text-base"
          >
            How It Works
          </a>
        </div>
        <p className="mt-4 text-xs text-gray-500">
          3 free scans per month. No credit card required.
        </p>
      </section>

      {/* What We Check */}
      <section className="px-8 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          Three audits, one scan
        </h2>
        <p className="text-gray-400 text-center mb-14 max-w-xl mx-auto">
          Every scan runs all three modules against your project. Nothing is
          written or modified -- every check is read-only.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="border border-gray-800 rounded-2xl p-8">
            <div className="w-10 h-10 bg-red-950/60 border border-red-800/40 rounded-lg flex items-center justify-center mb-5 text-red-400 font-bold text-sm">
              RLS
            </div>
            <h3 className="text-lg font-semibold mb-2">Row Level Security</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Discovers every table via the OpenAPI schema, then probes each one
              with the anon key. Flags tables that return data without
              authentication or allow anonymous inserts.
            </p>
          </div>
          <div className="border border-gray-800 rounded-2xl p-8">
            <div className="w-10 h-10 bg-amber-950/60 border border-amber-800/40 rounded-lg flex items-center justify-center mb-5 text-amber-400 font-bold text-sm">
              STR
            </div>
            <h3 className="text-lg font-semibold mb-2">Storage Buckets</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Lists every bucket and checks for public access, open directory
              listing, and anonymous upload permissions that could expose files
              or let attackers store arbitrary content.
            </p>
          </div>
          <div className="border border-gray-800 rounded-2xl p-8">
            <div className="w-10 h-10 bg-blue-950/60 border border-blue-800/40 rounded-lg flex items-center justify-center mb-5 text-blue-400 font-bold text-sm">
              AUTH
            </div>
            <h3 className="text-lg font-semibold mb-2">Auth Configuration</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Checks whether email confirmation is enforced, whether auth
              settings are exposed to unauthenticated users, and flags common
              misconfigurations that weaken account security.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-8 py-20 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-14">
          How it works
        </h2>
        <div className="space-y-12">
          <div className="flex items-start gap-6">
            <div className="shrink-0 w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-300">
              1
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Enter your project URL and anon key</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Both values are in your Supabase dashboard under Settings &gt;
                API. The anon key is safe to share -- it is the public key your
                frontend already uses.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-6">
            <div className="shrink-0 w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-300">
              2
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">We scan, read-only</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                The scanner runs all three audit modules in parallel. It only
                performs GET requests and anonymous access checks. Nothing is
                written, deleted, or modified in your project.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-6">
            <div className="shrink-0 w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-300">
              3
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Get your report with copy-paste fixes</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                You receive an A-F security grade, a breakdown of every finding
                by severity, and AI-generated SQL and config snippets you can
                apply immediately in the Supabase SQL editor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="px-8 py-20 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Simple pricing</h2>
        <p className="text-gray-400 mb-10 max-w-lg mx-auto">
          Start scanning for free. Upgrade when you need unlimited access.
        </p>
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="border border-gray-800 rounded-2xl p-8 text-left">
            <h3 className="font-semibold mb-1">Free</h3>
            <div className="text-3xl font-bold mb-4">
              $0<span className="text-base font-normal text-gray-400">/mo</span>
            </div>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>3 scans per month</li>
              <li>All audit modules</li>
              <li>AI fix suggestions</li>
            </ul>
          </div>
          <div className="border border-emerald-700/60 rounded-2xl p-8 text-left bg-emerald-950/20">
            <h3 className="font-semibold mb-1">Pro</h3>
            <div className="text-3xl font-bold mb-4">
              $29<span className="text-base font-normal text-gray-400">/mo</span>
            </div>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>Unlimited scans</li>
              <li>All audit modules</li>
              <li>AI fix suggestions</li>
              <li>Priority support</li>
            </ul>
          </div>
        </div>
        <a
          href="/login"
          className="inline-block mt-10 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
        >
          Get Started Free
        </a>
      </section>

      {/* Footer */}
      <footer className="px-8 py-10 max-w-6xl mx-auto border-t border-gray-800 text-center text-sm text-gray-500">
        Supabase Security Scanner. Your credentials are never persisted.
      </footer>
    </main>
  );
}
