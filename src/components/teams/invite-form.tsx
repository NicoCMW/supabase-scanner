"use client";

import { useState } from "react";

interface InviteFormProps {
  readonly teamId: string;
}

export function InviteForm({ teamId }: InviteFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    readonly type: "success" | "error";
    readonly text: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setMessage(null);

    const res = await fetch(`/api/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), role }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage({ type: "success", text: `Invitation sent to ${email}` });
      setEmail("");
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setMessage({ type: "error", text: data.error ?? "Failed to send invite" });
    }

    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1">
        <label
          htmlFor="invite-email"
          className="block text-sm font-medium text-sand-700 mb-1"
        >
          Invite by email
        </label>
        <input
          id="invite-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@example.com"
          required
          className="w-full px-3 py-2 text-sm border border-sand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-900 focus:border-transparent"
        />
      </div>
      <div>
        <label
          htmlFor="invite-role"
          className="block text-sm font-medium text-sand-700 mb-1"
        >
          Role
        </label>
        <select
          id="invite-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-3 py-2 text-sm border border-sand-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sand-900"
        >
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 text-sm font-medium bg-sand-900 hover:bg-sand-700 text-white rounded-lg transition-colors disabled:opacity-50"
      >
        {submitting ? "Sending..." : "Send Invite"}
      </button>
      {message && (
        <p
          className={`text-sm ${message.type === "success" ? "text-emerald-600" : "text-red-600"}`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
