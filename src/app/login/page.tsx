"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowser();

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm text-center space-y-4">
          <h1 className="text-xl font-semibold text-sand-900">
            Check your email
          </h1>
          <p className="text-sand-500 text-sm leading-relaxed">
            We sent a magic link to{" "}
            <strong className="text-sand-900">{email}</strong>. Click the link
            to sign in.
          </p>
          <button
            onClick={() => setSent(false)}
            className="text-sm text-sand-500 hover:text-sand-900 underline underline-offset-2 transition-colors"
          >
            Use a different email
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <a
            href="/"
            className="text-base font-semibold tracking-tight text-sand-900"
          >
            SupaScanner
          </a>
          <h1 className="text-xl font-semibold mt-6 text-sand-900">Sign in</h1>
          <p className="text-sand-500 text-sm mt-1">
            Enter your email to receive a magic link.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-sand-700 mb-1.5"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-sand-200 rounded-lg text-sand-900 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-sand-900/10 focus:border-sand-300 transition-colors"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-sand-900 hover:bg-sand-700 disabled:bg-sand-200 disabled:text-sand-400 text-white font-medium rounded-lg transition-colors text-sm"
          >
            {loading ? "Sending..." : "Send magic link"}
          </button>
        </form>
      </div>
    </main>
  );
}
