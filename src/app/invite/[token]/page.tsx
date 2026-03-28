"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function InviteAcceptPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);

  useEffect(() => {
    // We cannot prefetch invite info without an API for it,
    // so we show the generic accept UI
  }, []);

  async function handleAccept() {
    setAccepting(true);
    setError(null);

    const res = await fetch("/api/teams/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token }),
    });

    const data = await res.json();

    if (res.ok) {
      setTeamName(data.team?.name ?? null);
      const teamId = data.team?.id ?? data.member?.team_id;
      if (teamId) {
        router.push(`/dashboard/teams/${teamId}`);
      } else {
        router.push("/dashboard/teams");
      }
    } else if (res.status === 401) {
      // Not logged in - redirect to login with return URL
      const returnUrl = encodeURIComponent(`/invite/${params.token}`);
      router.push(`/login?returnTo=${returnUrl}`);
    } else {
      setError(data.error ?? "Failed to accept invitation");
      setAccepting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 bg-white border border-sand-200 rounded-lg text-center">
        <h1 className="text-xl font-semibold text-sand-900 mb-2">
          Team Invitation
        </h1>
        <p className="text-sand-400 text-sm mb-6">
          {teamName
            ? `You've been invited to join ${teamName} on SupaScanner.`
            : "You've been invited to join a team on SupaScanner."}
        </p>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          type="button"
          onClick={handleAccept}
          disabled={accepting}
          className="w-full px-4 py-3 bg-sand-900 hover:bg-sand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {accepting ? "Accepting..." : "Accept Invitation"}
        </button>

        <p className="text-xs text-sand-400 mt-4">
          You&apos;ll need to be signed in to accept this invitation.
        </p>
      </div>
    </main>
  );
}
