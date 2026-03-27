"use client";

import { useState, useEffect, useCallback } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

const STORAGE_KEY = "supascanner-checklist";

const sections = [
  {
    id: "rls",
    title: "Row Level Security",
    icon: "RLS",
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    items: [
      { id: "rls-1", text: "Enable RLS on every table that stores user data" },
      { id: "rls-2", text: "Create SELECT, INSERT, UPDATE, and DELETE policies per table" },
      { id: "rls-3", text: "Use auth.uid() in policy expressions for user-scoped access" },
      { id: "rls-4", text: "Test policies with different user roles before deploying" },
      { id: "rls-5", text: "Audit views for SECURITY DEFINER leaks that bypass RLS" },
      { id: "rls-6", text: "Avoid using service_role key in client-side code to bypass RLS" },
      { id: "rls-7", text: "Review RLS policies after every schema migration" },
    ],
  },
  {
    id: "api-keys",
    title: "API Key Management",
    icon: "KEY",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    items: [
      { id: "key-1", text: "Never expose the service_role key in client-side code" },
      { id: "key-2", text: "Use the anon key only in combination with RLS" },
      { id: "key-3", text: "Rotate keys periodically and after any suspected exposure" },
      { id: "key-4", text: "Store keys in environment variables, never in source code" },
      { id: "key-5", text: "Audit your git history for accidentally committed keys" },
      { id: "key-6", text: "Use separate Supabase projects for development and production" },
    ],
  },
  {
    id: "storage",
    title: "Storage Buckets",
    icon: "STR",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    items: [
      { id: "str-1", text: "Set buckets to private unless public access is intentional" },
      { id: "str-2", text: "Create storage RLS policies for upload and download" },
      { id: "str-3", text: "Restrict anonymous uploads to prevent abuse" },
      { id: "str-4", text: "Audit bucket listing permissions" },
      { id: "str-5", text: "Set file size limits appropriate to your use case" },
      { id: "str-6", text: "Validate MIME types server-side before accepting uploads" },
    ],
  },
  {
    id: "auth",
    title: "Authentication",
    icon: "AUTH",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    items: [
      { id: "auth-1", text: "Enable email confirmation for new signups" },
      { id: "auth-2", text: "Configure MFA (TOTP) for sensitive applications" },
      { id: "auth-3", text: "Set strong password policies (min length, complexity)" },
      { id: "auth-4", text: "Review OAuth provider configurations and redirect URLs" },
      { id: "auth-5", text: "Set appropriate session token lifetimes" },
      { id: "auth-6", text: "Disable unused auth providers to reduce attack surface" },
      { id: "auth-7", text: "Implement rate limiting on auth endpoints" },
    ],
  },
  {
    id: "functions",
    title: "Database Functions",
    icon: "FN",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    items: [
      { id: "fn-1", text: "Mark functions as SECURITY INVOKER unless DEFINER is required" },
      { id: "fn-2", text: "Validate all input parameters inside functions" },
      { id: "fn-3", text: "Avoid granting EXECUTE on functions to public/anon roles unnecessarily" },
      { id: "fn-4", text: "Use search_path = '' to prevent schema injection in functions" },
      { id: "fn-5", text: "Review functions that modify data for privilege escalation risks" },
    ],
  },
  {
    id: "edge",
    title: "Edge Functions",
    icon: "EDGE",
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    items: [
      { id: "edge-1", text: "Validate and sanitize all request inputs" },
      { id: "edge-2", text: "Store secrets in Supabase Vault or environment variables, not in code" },
      { id: "edge-3", text: "Verify JWT tokens before processing authenticated requests" },
      { id: "edge-4", text: "Implement rate limiting to prevent abuse" },
      { id: "edge-5", text: "Set appropriate CORS headers for your domain" },
      { id: "edge-6", text: "Never log sensitive data (tokens, passwords, PII)" },
    ],
  },
  {
    id: "general",
    title: "General Hardening",
    icon: "SEC",
    iconBg: "bg-sand-100",
    iconColor: "text-sand-600",
    items: [
      { id: "gen-1", text: "Disable Realtime on tables that do not need it" },
      { id: "gen-2", text: "Enable database audit logging" },
      { id: "gen-3", text: "Set up monitoring and alerting for suspicious activity" },
      { id: "gen-4", text: "Use SSL/TLS for all database connections" },
      { id: "gen-5", text: "Review and restrict the public schema exposure in API settings" },
      { id: "gen-6", text: "Schedule regular security reviews as part of your release process" },
    ],
  },
] as const;

const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);

function loadChecked(): ReadonlySet<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set();
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) return new Set(parsed);
  } catch {
    // ignore corrupted storage
  }
  return new Set();
}

function saveChecked(checked: ReadonlySet<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...checked]));
  } catch {
    // storage full or unavailable
  }
}

export function SecurityChecklistInteractive() {
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [formMessage, setFormMessage] = useState("");

  useEffect(() => {
    setChecked(loadChecked());
    setMounted(true);
    try {
      const submitted = localStorage.getItem(`${STORAGE_KEY}-email`);
      if (submitted === "true") setEmailSubmitted(true);
    } catch {
      // ignore
    }
  }, []);

  const checkedCount = checked.size;
  const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  const toggle = useCallback(
    (id: string) => {
      setChecked((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        saveChecked(next);

        // Show email gate when user checks 5+ items and hasn't submitted email
        if (next.size >= 5 && !emailSubmitted) {
          setShowEmailGate(true);
        }

        return next;
      });
    },
    [emailSubmitted],
  );

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setFormState("submitting");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "security_checklist" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormState("error");
        setFormMessage(data.error ?? "Something went wrong.");
        return;
      }
      setFormState("success");
      setFormMessage("Saved! Your progress is linked to your email.");
      setEmailSubmitted(true);
      setShowEmailGate(false);
      try {
        localStorage.setItem(`${STORAGE_KEY}-email`, "true");
      } catch {
        // ignore
      }
    } catch {
      setFormState("error");
      setFormMessage("Something went wrong. Please try again.");
    }
  }

  function dismissGate() {
    setShowEmailGate(false);
  }

  return (
    <div>
      {/* Progress bar - sticky */}
      <div className="sticky top-0 z-10 bg-sand-50/95 backdrop-blur-sm border-b border-sand-200 -mx-8 px-8 py-4 mb-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-sand-900">
              {mounted ? checkedCount : 0} of {totalItems} items checked
            </span>
            <span className="text-sm font-semibold text-sand-900">
              {mounted ? progress : 0}%
            </span>
          </div>
          <div className="w-full h-2 bg-sand-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${mounted ? progress : 0}%`,
                backgroundColor:
                  progress === 100
                    ? "#16a34a"
                    : progress >= 75
                      ? "#2563eb"
                      : progress >= 50
                        ? "#d97706"
                        : "#78716c",
              }}
            />
          </div>
        </div>
      </div>

      {/* Email gate modal */}
      {showEmailGate && !emailSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sand-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-sand-200 p-8 max-w-md w-full shadow-lg">
            <h3 className="text-lg font-semibold text-sand-900 mb-2">
              Save your checklist progress
            </h3>
            <p className="text-sm text-sand-500 mb-6">
              Enter your email to save your progress and get our free Supabase
              security tips delivered to your inbox.
            </p>
            {formState === "success" ? (
              <p className="text-sm text-green-700 font-medium">{formMessage}</p>
            ) : (
              <form onSubmit={handleEmailSubmit}>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formState === "error") setFormState("idle");
                  }}
                  className="w-full px-4 py-2.5 border border-sand-200 rounded-lg text-sm text-sand-900 placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-sand-300 bg-white mb-3"
                />
                {formState === "error" && (
                  <p className="text-xs text-red-600 mb-3">{formMessage}</p>
                )}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={formState === "submitting"}
                    className="flex-1 px-6 py-2.5 bg-sand-900 hover:bg-sand-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    {formState === "submitting" ? "Saving..." : "Save progress"}
                  </button>
                  <button
                    type="button"
                    onClick={dismissGate}
                    className="px-4 py-2.5 border border-sand-200 hover:border-sand-300 text-sand-600 font-medium rounded-lg transition-colors text-sm"
                  >
                    Skip
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Checklist sections */}
      <div className="space-y-12">
        {sections.map((section) => {
          const sectionChecked = section.items.filter((item) =>
            checked.has(item.id),
          ).length;
          const sectionTotal = section.items.length;
          const sectionDone = sectionChecked === sectionTotal;

          return (
            <section key={section.id}>
              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`w-9 h-9 ${section.iconBg} rounded-lg flex items-center justify-center ${section.iconColor} font-semibold text-[10px]`}
                >
                  {section.icon}
                </div>
                <h2 className="text-xl font-semibold text-sand-900 flex-1">
                  {section.title}
                </h2>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    sectionDone
                      ? "bg-green-50 text-green-700"
                      : "bg-sand-100 text-sand-500"
                  }`}
                >
                  {mounted ? sectionChecked : 0}/{sectionTotal}
                </span>
              </div>
              <ul className="space-y-2">
                {section.items.map((item) => {
                  const isChecked = mounted && checked.has(item.id);
                  return (
                    <li key={item.id}>
                      <label className="flex items-start gap-3 text-sm cursor-pointer group p-3 rounded-lg hover:bg-white transition-colors">
                        <span
                          className={`shrink-0 mt-0.5 w-5 h-5 border rounded flex items-center justify-center transition-colors ${
                            isChecked
                              ? "bg-sand-900 border-sand-900 text-white"
                              : "border-sand-300 text-transparent group-hover:border-sand-400"
                          }`}
                        >
                          {isChecked && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M2.5 6L5 8.5L9.5 3.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggle(item.id)}
                          className="sr-only"
                          aria-label={item.text}
                        />
                        <span
                          className={`transition-colors ${
                            isChecked
                              ? "text-sand-400 line-through"
                              : "text-sand-600"
                          }`}
                        >
                          {item.text}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Completion state */}
      {mounted && progress === 100 && (
        <div className="mt-12 p-6 bg-green-50 border border-green-200 rounded-xl text-center">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Checklist complete!
          </h3>
          <p className="text-sm text-green-700 mb-4">
            You have reviewed all {totalItems} security items. Now automate
            these checks with a free scan.
          </p>
          <a
            href="/login"
            className="inline-block px-7 py-2.5 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg transition-colors text-sm"
          >
            Run free automated scan
          </a>
        </div>
      )}

      {/* CTA */}
      <aside className="mt-16 pt-8 border-t border-sand-200 text-center">
        <h2 className="text-xl font-semibold mb-2 text-sand-900">
          Automate this checklist
        </h2>
        <p className="text-sand-500 text-sm mb-5 max-w-md mx-auto">
          SupaScanner checks your project against these items automatically and
          gives you copy-paste SQL fixes in under 40 seconds.
        </p>
        <a
          href="/login"
          className="inline-block px-7 py-2.5 bg-sand-900 hover:bg-sand-700 text-white font-medium rounded-lg transition-colors text-sm"
        >
          Start free scan
        </a>
      </aside>

      {/* Inline email capture for users who dismissed the modal */}
      {!emailSubmitted && (
        <div className="mt-12 p-6 border border-sand-200 rounded-xl bg-white text-center">
          <h3 className="text-base font-semibold text-sand-900 mb-1">
            Get Supabase security tips in your inbox
          </h3>
          <p className="text-sm text-sand-500 mb-4 max-w-md mx-auto">
            Join developers who keep their Supabase projects secure. We send
            actionable tips, not spam.
          </p>
          {formState === "success" ? (
            <p className="text-sm text-green-700 font-medium">{formMessage}</p>
          ) : (
            <form
              onSubmit={handleEmailSubmit}
              className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-md mx-auto"
            >
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formState === "error") setFormState("idle");
                }}
                className="flex-1 w-full px-4 py-2.5 border border-sand-200 rounded-lg text-sm text-sand-900 placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-sand-300 bg-white"
              />
              <button
                type="submit"
                disabled={formState === "submitting"}
                className="shrink-0 px-6 py-2.5 bg-sand-900 hover:bg-sand-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-sm"
              >
                {formState === "submitting" ? "Subscribing..." : "Subscribe"}
              </button>
              {formState === "error" && (
                <p className="w-full text-xs text-red-600 mt-1 text-center sm:text-left">
                  {formMessage}
                </p>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
