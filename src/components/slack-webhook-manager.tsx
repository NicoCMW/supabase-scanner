"use client";

import { useCallback, useEffect, useState } from "react";

interface Webhook {
  readonly id: string;
  readonly label: string;
  readonly channel_name: string | null;
  readonly enabled: boolean;
  readonly notify_scan_complete: boolean;
  readonly notify_critical_finding: boolean;
  readonly notify_score_degradation: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export function SlackWebhookManager() {
  const [webhooks, setWebhooks] = useState<readonly Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    id: string;
    success: boolean;
  } | null>(null);

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch("/api/slack/webhooks");
      const data = await res.json();
      if (res.ok) {
        setWebhooks(data.webhooks);
      }
    } catch {
      // Silently fail on fetch
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  async function handleCreate(webhookUrl: string, label: string, channelName: string) {
    setError(null);
    const res = await fetch("/api/slack/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhookUrl,
        label: label || undefined,
        channelName: channelName || undefined,
      }),
    });

    if (res.ok) {
      setShowForm(false);
      await fetchWebhooks();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to create webhook");
    }
  }

  async function handleToggle(id: string, enabled: boolean) {
    const res = await fetch(`/api/slack/webhooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if (res.ok) {
      await fetchWebhooks();
    }
  }

  async function handleToggleNotification(
    id: string,
    field: string,
    value: boolean,
  ) {
    const res = await fetch(`/api/slack/webhooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      await fetchWebhooks();
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/slack/webhooks/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await fetchWebhooks();
    }
  }

  async function handleTest(id: string) {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await fetch(`/api/slack/webhooks/${id}/test`, {
        method: "POST",
      });
      setTestResult({ id, success: res.ok });
    } catch {
      setTestResult({ id, success: false });
    } finally {
      setTestingId(null);
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-sand-400">Loading Slack integrations...</div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-sand-900">
            Slack Notifications
          </h2>
          <p className="text-sm text-sand-400">
            Receive real-time scan alerts in your Slack channels.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-sand-900 hover:bg-sand-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {showForm ? "Cancel" : "Add webhook"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {showForm && (
        <WebhookForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {webhooks.length === 0 && !showForm ? (
        <div className="text-center py-8 text-sand-400 text-sm">
          <p>No Slack webhooks configured yet.</p>
          <p className="mt-1">
            Add a webhook to receive scan alerts in Slack.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <WebhookCard
              key={webhook.id}
              webhook={webhook}
              onToggle={handleToggle}
              onToggleNotification={handleToggleNotification}
              onDelete={handleDelete}
              onTest={handleTest}
              testing={testingId === webhook.id}
              testResult={
                testResult?.id === webhook.id ? testResult.success : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WebhookForm({
  onSubmit,
  onCancel,
}: {
  readonly onSubmit: (url: string, label: string, channel: string) => void;
  readonly onCancel: () => void;
}) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [channel, setChannel] = useState("");

  return (
    <div className="mb-4 p-4 bg-sand-50 border border-sand-200 rounded-lg">
      <h3 className="text-sm font-medium text-sand-900 mb-3">
        Add Slack Webhook
      </h3>
      <div className="space-y-3">
        <div>
          <label
            htmlFor="webhook-url"
            className="block text-xs text-sand-500 mb-1"
          >
            Webhook URL
          </label>
          <input
            id="webhook-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/T.../B.../..."
            className="w-full px-3 py-2 text-sm border border-sand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-900"
          />
          <p className="mt-1 text-xs text-sand-400">
            Create an{" "}
            <a
              href="https://api.slack.com/messaging/webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-sand-600"
            >
              Incoming Webhook
            </a>{" "}
            in your Slack workspace settings.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="webhook-label"
              className="block text-xs text-sand-500 mb-1"
            >
              Label
            </label>
            <input
              id="webhook-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. #security-alerts"
              className="w-full px-3 py-2 text-sm border border-sand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-900"
            />
          </div>
          <div>
            <label
              htmlFor="webhook-channel"
              className="block text-xs text-sand-500 mb-1"
            >
              Channel (optional)
            </label>
            <input
              id="webhook-channel"
              type="text"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="#security-alerts"
              className="w-full px-3 py-2 text-sm border border-sand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-900"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSubmit(url, label, channel)}
            disabled={!url}
            className="px-3 py-1.5 bg-sand-900 hover:bg-sand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add webhook
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sand-500 hover:text-sand-900 text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function WebhookCard({
  webhook,
  onToggle,
  onToggleNotification,
  onDelete,
  onTest,
  testing,
  testResult,
}: {
  readonly webhook: Webhook;
  readonly onToggle: (id: string, enabled: boolean) => void;
  readonly onToggleNotification: (
    id: string,
    field: string,
    value: boolean,
  ) => void;
  readonly onDelete: (id: string) => void;
  readonly onTest: (id: string) => void;
  readonly testing: boolean;
  readonly testResult: boolean | null;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const notificationOptions = [
    {
      field: "notify_scan_complete",
      label: "Scan complete",
      value: webhook.notify_scan_complete,
    },
    {
      field: "notify_critical_finding",
      label: "Critical findings",
      value: webhook.notify_critical_finding,
    },
    {
      field: "notify_score_degradation",
      label: "Score degradation",
      value: webhook.notify_score_degradation,
    },
  ] as const;

  return (
    <div className="p-4 bg-white border border-sand-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              webhook.enabled ? "bg-green-500" : "bg-sand-300"
            }`}
          />
          <span className="text-sm font-medium text-sand-900">
            {webhook.label}
          </span>
          {webhook.channel_name && (
            <span className="text-xs text-sand-400">
              {webhook.channel_name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onTest(webhook.id)}
            disabled={testing || !webhook.enabled}
            className="text-xs text-sand-500 hover:text-sand-900 transition-colors disabled:opacity-50"
          >
            {testing ? "Sending..." : "Test"}
          </button>
          <button
            type="button"
            onClick={() => onToggle(webhook.id, !webhook.enabled)}
            className="text-xs text-sand-500 hover:text-sand-900 transition-colors"
          >
            {webhook.enabled ? "Disable" : "Enable"}
          </button>
          {confirmDelete ? (
            <span className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onDelete(webhook.id)}
                className="text-xs text-red-600 hover:text-red-800 transition-colors"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-sand-500 hover:text-sand-900 transition-colors"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {testResult !== null && (
        <div
          className={`mb-3 p-2 text-xs rounded ${
            testResult
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {testResult
            ? "Test message sent successfully!"
            : "Failed to send test message. Check the webhook URL."}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {notificationOptions.map((opt) => (
          <label
            key={opt.field}
            className="flex items-center gap-1.5 text-xs text-sand-600 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={opt.value}
              onChange={(e) =>
                onToggleNotification(webhook.id, opt.field, e.target.checked)
              }
              className="rounded border-sand-300 text-sand-900 focus:ring-sand-900"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}
