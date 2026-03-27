"use client";

import { useCallback, useEffect, useState } from "react";

interface Schedule {
  readonly id: string;
  readonly supabase_url: string;
  readonly frequency: "weekly" | "monthly";
  readonly enabled: boolean;
  readonly next_run_at: string;
  readonly last_run_at: string | null;
  readonly last_scan_job_id: string | null;
  readonly consecutive_failures: number;
  readonly created_at: string;
}

export function ScheduleManager() {
  const [schedules, setSchedules] = useState<readonly Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch("/api/schedules");
      const data = await res.json();
      if (res.ok) {
        setSchedules(data.schedules);
      }
    } catch {
      // Silently fail on fetch
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  async function handleToggle(id: string, enabled: boolean) {
    const res = await fetch(`/api/schedules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if (res.ok) {
      await fetchSchedules();
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
    if (res.ok) {
      await fetchSchedules();
    }
  }

  async function handleFrequencyChange(id: string, frequency: string) {
    const res = await fetch(`/api/schedules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frequency }),
    });
    if (res.ok) {
      await fetchSchedules();
    }
  }

  async function handleCreate(
    supabaseUrl: string,
    anonKey: string,
    frequency: string,
  ) {
    setError(null);
    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supabaseUrl, anonKey, frequency }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create schedule");
      return;
    }

    setShowForm(false);
    await fetchSchedules();
  }

  if (loading) {
    return (
      <div className="bg-sand-50 border border-sand-200 rounded-lg p-6">
        <p className="text-sand-400 text-sm">Loading schedules...</p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-sand-900">
          Scheduled Scans
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 bg-sand-900 hover:bg-sand-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Add schedule
          </button>
        )}
      </div>

      {showForm && (
        <ScheduleForm
          onSubmit={handleCreate}
          onCancel={() => {
            setShowForm(false);
            setError(null);
          }}
          error={error}
        />
      )}

      {schedules.length === 0 && !showForm ? (
        <div className="bg-sand-50 border border-sand-200 rounded-lg p-6 text-center">
          <p className="text-sand-500 text-sm">
            No scheduled scans yet. Set up automatic recurring scans to
            continuously monitor your Supabase project security.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => (
            <ScheduleCard
              key={s.id}
              schedule={s}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onFrequencyChange={handleFrequencyChange}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ScheduleForm({
  onSubmit,
  onCancel,
  error,
}: {
  readonly onSubmit: (url: string, key: string, freq: string) => void;
  readonly onCancel: () => void;
  readonly error: string | null;
}) {
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [freq, setFreq] = useState("weekly");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(url, key, freq);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-sand-200 rounded-lg p-4 space-y-3"
    >
      <div>
        <label
          htmlFor="scheduleUrl"
          className="block text-sm font-medium text-sand-700 mb-1"
        >
          Supabase Project URL
        </label>
        <input
          id="scheduleUrl"
          type="url"
          required
          placeholder="https://your-project.supabase.co"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-sand-200 rounded-lg text-sand-900 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-sand-900/10 focus:border-sand-300 text-sm"
          disabled={submitting}
        />
      </div>

      <div>
        <label
          htmlFor="scheduleKey"
          className="block text-sm font-medium text-sand-700 mb-1"
        >
          Anon (Public) Key
        </label>
        <input
          id="scheduleKey"
          type="password"
          required
          placeholder="eyJhbGciOiJIUzI1NiIs..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-sand-200 rounded-lg text-sand-900 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-sand-900/10 focus:border-sand-300 text-sm"
          disabled={submitting}
        />
        <p className="text-xs text-sand-400 mt-1">
          Your key is encrypted at rest and only used during scheduled scans.
        </p>
      </div>

      <div>
        <label
          htmlFor="scheduleFreq"
          className="block text-sm font-medium text-sand-700 mb-1"
        >
          Frequency
        </label>
        <select
          id="scheduleFreq"
          value={freq}
          onChange={(e) => setFreq(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-sand-200 rounded-lg text-sand-900 focus:outline-none focus:ring-2 focus:ring-sand-900/10 focus:border-sand-300 text-sm"
          disabled={submitting}
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-sand-900 hover:bg-sand-700 disabled:bg-sand-200 disabled:text-sand-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {submitting ? "Creating..." : "Create schedule"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sand-600 hover:text-sand-900 text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function ScheduleCard({
  schedule,
  onToggle,
  onDelete,
  onFrequencyChange,
}: {
  readonly schedule: Schedule;
  readonly onToggle: (id: string, enabled: boolean) => void;
  readonly onDelete: (id: string) => void;
  readonly onFrequencyChange: (id: string, frequency: string) => void;
}) {
  const nextRun = new Date(schedule.next_run_at);
  const lastRun = schedule.last_run_at
    ? new Date(schedule.last_run_at)
    : null;
  const hasFailures = schedule.consecutive_failures > 0;

  return (
    <div
      className={`bg-white border rounded-lg p-4 ${
        schedule.enabled
          ? "border-sand-200"
          : "border-sand-100 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-sand-900 truncate">
            {schedule.supabase_url}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-sand-400">
            <select
              value={schedule.frequency}
              onChange={(e) =>
                onFrequencyChange(schedule.id, e.target.value)
              }
              className="bg-transparent border-none p-0 text-xs text-sand-500 focus:outline-none cursor-pointer"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            {schedule.enabled && (
              <span>
                Next: {nextRun.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
            {lastRun && (
              <span>
                Last: {lastRun.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
            {schedule.last_scan_job_id && (
              <a
                href={`/scan/${schedule.last_scan_job_id}`}
                className="text-sand-500 hover:text-sand-900 underline"
              >
                View last scan
              </a>
            )}
          </div>
          {hasFailures && (
            <p className="text-xs text-amber-600 mt-1">
              {schedule.consecutive_failures} consecutive failure
              {schedule.consecutive_failures === 1 ? "" : "s"}
              {!schedule.enabled && " - auto-disabled"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onToggle(schedule.id, !schedule.enabled)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              schedule.enabled ? "bg-sand-900" : "bg-sand-200"
            }`}
            aria-label={schedule.enabled ? "Disable" : "Enable"}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                schedule.enabled ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
          <button
            onClick={() => onDelete(schedule.id)}
            className="text-sand-300 hover:text-red-500 transition-colors p-1"
            aria-label="Delete schedule"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
              <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
