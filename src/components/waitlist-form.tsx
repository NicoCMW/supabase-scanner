"use client";

import { useState } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) return;

    setState("submitting");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState("error");
        setMessage(data.error ?? "Something went wrong.");
        return;
      }

      setState("success");
      setMessage(data.message ?? "You're on the list!");
      setEmail("");
    } catch {
      setState("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  if (state === "success") {
    return (
      <p className="text-sm text-sand-600 font-medium">{message}</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-md mx-auto">
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (state === "error") setState("idle");
        }}
        className="flex-1 w-full px-4 py-2.5 border border-sand-200 rounded-lg text-sm text-sand-900 placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-sand-300 bg-white"
      />
      <button
        type="submit"
        disabled={state === "submitting"}
        className="shrink-0 px-6 py-2.5 bg-sand-900 hover:bg-sand-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-sm"
      >
        {state === "submitting" ? "Joining..." : "Join the waitlist"}
      </button>
      {state === "error" && (
        <p className="w-full text-xs text-red-600 mt-1 text-center sm:text-left">{message}</p>
      )}
    </form>
  );
}
