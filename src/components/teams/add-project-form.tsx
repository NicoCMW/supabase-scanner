"use client";

import { useState } from "react";

interface AddProjectFormProps {
  readonly teamId: string;
}

export function AddProjectForm({ teamId }: AddProjectFormProps) {
  const [name, setName] = useState("");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    readonly type: "success" | "error";
    readonly text: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !supabaseUrl.trim()) return;

    setSubmitting(true);
    setMessage(null);

    const res = await fetch(`/api/teams/${teamId}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        supabaseUrl: supabaseUrl.trim(),
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage({ type: "success", text: `Project "${name}" added` });
      setName("");
      setSupabaseUrl("");
      setTimeout(() => window.location.reload(), 1000);
    } else {
      setMessage({
        type: "error",
        text: data.error ?? "Failed to add project",
      });
    }

    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-sm font-medium text-sand-700 mb-3">
        Add Project
      </h3>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label
            htmlFor="project-name"
            className="block text-xs text-sand-500 mb-1"
          >
            Name
          </label>
          <input
            id="project-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Production API"
            required
            className="w-full px-3 py-2 text-sm border border-sand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-900 focus:border-transparent"
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="supabase-url"
            className="block text-xs text-sand-500 mb-1"
          >
            Supabase URL
          </label>
          <input
            id="supabase-url"
            type="url"
            value={supabaseUrl}
            onChange={(e) => setSupabaseUrl(e.target.value)}
            placeholder="https://abc.supabase.co"
            required
            className="w-full px-3 py-2 text-sm border border-sand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-900 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium bg-sand-900 hover:bg-sand-700 text-white rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {submitting ? "Adding..." : "Add Project"}
        </button>
      </div>
      {message && (
        <p
          className={`text-sm mt-2 ${message.type === "success" ? "text-emerald-600" : "text-red-600"}`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
