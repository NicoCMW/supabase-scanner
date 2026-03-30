"use client";

import { useCallback, useEffect, useState } from "react";

interface WebhookListItem {
  readonly id: string;
  readonly project_id: string | null;
  readonly label: string;
  readonly enabled: boolean;
  readonly notify_scan_complete: boolean;
  readonly notify_critical_finding: boolean;
  readonly notify_score_degradation: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

interface WebhookDetail extends WebhookListItem {
  readonly url: string;
  readonly secret: string;
}

interface DeliveryLog {
  readonly id: string;
  readonly event_type: string;
  readonly response_status: number | null;
  readonly success: boolean;
  readonly attempt: number;
  readonly error_message: string | null;
  readonly created_at: string;
}

export function WebhookManager() {
  const [webhooks, setWebhooks] = useState<readonly WebhookListItem[]>([]);
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
      const res = await fetch("/api/webhooks");
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

  async function handleCreate(url: string, label: string) {
    setError(null);
    const res = await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        label: label || undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setShowForm(false);
      await fetchWebhooks();
      // Show the secret to the user once
      if (data.webhook?.secret) {
        setNewSecret({ id: data.webhook.id, secret: data.webhook.secret });
      }
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to create webhook");
    }
  }

  const [newSecret, setNewSecret] = useState<{
    id: string;
    secret: string;
  } | null>(null);

  async function handleToggle(id: string, enabled: boolean) {
    const res = await fetch(`/api/webhooks/${id}`, {
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
    const res = await fetch(`/api/webhooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      await fetchWebhooks();
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/webhooks/${id}`, {
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
      const res = await fetch(`/api/webhooks/${id}/test`, {
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
      <div className="text-sm text-sand-400">Loading webhooks...</div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-sand-900">
            Webhooks
          </h2>
          <p className="text-sm text-sand-400">
            Receive scan results via HTTP POST to any endpoint. Supports Discord, PagerDuty, Zapier, and custom integrations.
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

      {newSecret && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 text-sm rounded-lg">
          <p className="font-medium text-amber-800 mb-1">
            Signing secret (shown once):
          </p>
          <code className="block p-2 bg-white border border-amber-200 rounded text-xs font-mono break-all text-amber-900">
            {newSecret.secret}
          </code>
          <p className="mt-2 text-xs text-amber-600">
            Use this secret to verify webhook signatures via the{" "}
            <code className="font-mono">X-Webhook-Signature</code> header (HMAC-SHA256).
          </p>
          <button
            type="button"
            onClick={() => setNewSecret(null)}
            className="mt-2 text-xs text-amber-700 hover:text-amber-900 underline"
          >
            Dismiss
          </button>
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
          <p>No webhooks configured yet.</p>
          <p className="mt-1">
            Add a webhook to receive scan results via HTTP POST.
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
  readonly onSubmit: (url: string, label: string) => void;
  readonly onCancel: () => void;
}) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");

  return (
    <div className="mb-4 p-4 bg-sand-50 border border-sand-200 rounded-lg">
      <h3 className="text-sm font-medium text-sand-900 mb-3">
        Add Webhook
      </h3>
      <div className="space-y-3">
        <div>
          <label
            htmlFor="wh-url"
            className="block text-xs text-sand-500 mb-1"
          >
            Endpoint URL
          </label>
          <input
            id="wh-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-server.com/webhook"
            className="w-full px-3 py-2 text-sm border border-sand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-900"
          />
          <p className="mt-1 text-xs text-sand-400">
            Must be an HTTPS URL. A signing secret will be generated automatically.
          </p>
        </div>
        <div>
          <label
            htmlFor="wh-label"
            className="block text-xs text-sand-500 mb-1"
          >
            Label
          </label>
          <input
            id="wh-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. PagerDuty, Discord, CI Pipeline"
            className="w-full px-3 py-2 text-sm border border-sand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-900"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSubmit(url, label)}
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
  readonly webhook: WebhookListItem;
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
  const [showDeliveries, setShowDeliveries] = useState(false);
  const [deliveries, setDeliveries] = useState<readonly DeliveryLog[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  async function fetchDeliveries() {
    if (showDeliveries) {
      setShowDeliveries(false);
      return;
    }
    setLoadingDeliveries(true);
    setShowDeliveries(true);
    try {
      const res = await fetch(`/api/webhooks/${webhook.id}/deliveries?limit=10`);
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data.deliveries);
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingDeliveries(false);
    }
  }

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
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchDeliveries}
            className="text-xs text-sand-500 hover:text-sand-900 transition-colors"
          >
            {showDeliveries ? "Hide log" : "Delivery log"}
          </button>
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
            ? "Test payload delivered successfully!"
            : "Failed to deliver test payload. Check the endpoint URL."}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-2">
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

      {showDeliveries && (
        <div className="mt-3 border-t border-sand-100 pt-3">
          <h4 className="text-xs font-medium text-sand-700 mb-2">
            Recent Deliveries
          </h4>
          {loadingDeliveries ? (
            <p className="text-xs text-sand-400">Loading...</p>
          ) : deliveries.length === 0 ? (
            <p className="text-xs text-sand-400">No deliveries yet.</p>
          ) : (
            <div className="space-y-1">
              {deliveries.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-2 text-xs"
                >
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      d.success ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className="text-sand-500 font-mono">
                    {d.response_status ?? "ERR"}
                  </span>
                  <span className="text-sand-400">
                    attempt {d.attempt}
                  </span>
                  {d.error_message && (
                    <span className="text-red-500 truncate max-w-48">
                      {d.error_message}
                    </span>
                  )}
                  <span className="text-sand-300 ml-auto">
                    {new Date(d.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
