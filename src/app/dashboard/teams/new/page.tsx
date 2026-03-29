"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trackTeamCreated } from "@/lib/analytics/datalayer";

function generateSlugPreview(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export default function NewTeamPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slug = generateSlugPreview(name);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    const data = await res.json();

    if (res.ok) {
      trackTeamCreated();
      router.push(`/dashboard/teams/${data.team.id}`);
    } else {
      setError(data.error ?? "Failed to create team");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-xl mx-auto">
      <header className="mb-8">
        <Link
          href="/dashboard/teams"
          className="text-sm text-sand-400 hover:text-sand-900 transition-colors"
        >
          &larr; Back to Teams
        </Link>
        <h1 className="text-xl font-semibold text-sand-900 mt-4">
          Create a Team
        </h1>
        <p className="text-sand-400 text-sm mt-1">
          Organize your Supabase projects under one workspace.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="p-6 bg-white border border-sand-200 rounded-lg"
      >
        <div className="mb-4">
          <label
            htmlFor="team-name"
            className="block text-sm font-medium text-sand-700 mb-1"
          >
            Team name
          </label>
          <input
            id="team-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Engineering Team"
            required
            autoFocus
            className="w-full px-3 py-2 text-sm border border-sand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-900 focus:border-transparent"
          />
        </div>

        {slug && (
          <p className="text-xs text-sand-400 mb-4">
            Slug: <span className="font-mono text-sand-600">{slug}</span>
          </p>
        )}

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="w-full px-4 py-2 bg-sand-900 hover:bg-sand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Team"}
        </button>
      </form>
    </main>
  );
}
