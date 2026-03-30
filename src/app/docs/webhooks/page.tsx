import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo/config";
import { SiteHeader } from "@/components/site-header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DocsNav } from "@/components/docs-nav";

export const metadata: Metadata = {
  title: "Webhooks | SupaScanner",
  description:
    "SupaScanner webhook documentation. Receive scan results via HTTP POST to any endpoint with HMAC signature verification.",
  keywords: [
    "supabase scanner webhooks",
    "supascanner webhook integration",
    "scan result webhook",
  ],
  alternates: {
    canonical: `${siteConfig.url}/docs/webhooks`,
  },
  openGraph: {
    title: "Webhooks - SupaScanner",
    description:
      "Receive scan results via HTTP POST to any endpoint with HMAC signature verification.",
    url: `${siteConfig.url}/docs/webhooks`,
    type: "website",
    siteName: siteConfig.name,
  },
};

function CodeBlock({
  children,
  title,
}: {
  readonly children: string;
  readonly title?: string;
}) {
  return (
    <div className="my-4">
      {title && (
        <div className="text-xs text-sand-400 bg-sand-800 px-3 py-1.5 rounded-t-lg border border-b-0 border-sand-700 font-mono">
          {title}
        </div>
      )}
      <pre
        className={`bg-sand-900 text-sand-100 p-4 text-sm overflow-x-auto font-mono ${
          title ? "rounded-b-lg" : "rounded-lg"
        } border border-sand-700`}
      >
        <code>{children}</code>
      </pre>
    </div>
  );
}

export default function WebhooksDocsPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { label: "Docs", href: "/docs" },
            { label: "Webhooks", href: "/docs/webhooks" },
          ]}
        />

        <div className="flex gap-8 mt-6">
          <DocsNav currentPath="/docs/webhooks" />

          <article className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-sand-900 mb-2">
              Webhooks
            </h1>
            <p className="text-sand-500 mb-8">
              Receive scan results via HTTP POST to any endpoint. Integrate with Discord, PagerDuty, Zapier, or your own services.
            </p>

            <section className="mb-10">
              <h2 className="text-lg font-semibold text-sand-900 mb-3">
                Setup
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-sm text-sand-700">
                <li>Go to <strong>Dashboard &rarr; Integrations</strong></li>
                <li>Click <strong>Add webhook</strong> in the Webhooks section</li>
                <li>Enter your HTTPS endpoint URL and a label</li>
                <li>Copy the signing secret shown after creation (displayed only once)</li>
                <li>Configure which events trigger the webhook</li>
              </ol>
            </section>

            <section className="mb-10">
              <h2 className="text-lg font-semibold text-sand-900 mb-3">
                Events
              </h2>
              <div className="border border-sand-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-sand-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-sand-600 font-medium">Event</th>
                      <th className="text-left px-4 py-2 text-sand-600 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-sand-100">
                      <td className="px-4 py-2 font-mono text-xs">scan.completed</td>
                      <td className="px-4 py-2 text-sand-700">Sent when a scan finishes successfully</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-lg font-semibold text-sand-900 mb-3">
                Payload Schema
              </h2>
              <p className="text-sm text-sand-600 mb-3">
                All webhook payloads are sent as JSON via HTTP POST.
              </p>
              <CodeBlock title="scan.completed payload">{`{
  "event": "scan.completed",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "data": {
    "scanJobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "grade": "B",
    "totalFindings": 5,
    "criticalCount": 0,
    "highCount": 1,
    "mediumCount": 3,
    "lowCount": 1,
    "supabaseUrl": "https://your-project.supabase.co",
    "scanUrl": "https://supabase-scanner.vercel.app/scan/a1b2c3d4...",
    "durationMs": 4523,
    "previousGrade": "C"
  }
}`}</CodeBlock>

              <div className="border border-sand-200 rounded-lg overflow-hidden mt-4">
                <table className="w-full text-sm">
                  <thead className="bg-sand-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-sand-600 font-medium">Field</th>
                      <th className="text-left px-4 py-2 text-sand-600 font-medium">Type</th>
                      <th className="text-left px-4 py-2 text-sand-600 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-100">
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">event</td>
                      <td className="px-4 py-2 text-sand-500">string</td>
                      <td className="px-4 py-2 text-sand-700">Always &quot;scan.completed&quot;</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">timestamp</td>
                      <td className="px-4 py-2 text-sand-500">ISO 8601</td>
                      <td className="px-4 py-2 text-sand-700">When the webhook was sent</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">data.scanJobId</td>
                      <td className="px-4 py-2 text-sand-500">UUID</td>
                      <td className="px-4 py-2 text-sand-700">Unique scan job identifier</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">data.grade</td>
                      <td className="px-4 py-2 text-sand-500">A | B | C | D | F</td>
                      <td className="px-4 py-2 text-sand-700">Overall security grade</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">data.totalFindings</td>
                      <td className="px-4 py-2 text-sand-500">number</td>
                      <td className="px-4 py-2 text-sand-700">Total number of findings</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">data.criticalCount</td>
                      <td className="px-4 py-2 text-sand-500">number</td>
                      <td className="px-4 py-2 text-sand-700">Critical severity findings</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">data.highCount</td>
                      <td className="px-4 py-2 text-sand-500">number</td>
                      <td className="px-4 py-2 text-sand-700">High severity findings</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">data.mediumCount</td>
                      <td className="px-4 py-2 text-sand-500">number</td>
                      <td className="px-4 py-2 text-sand-700">Medium severity findings</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">data.lowCount</td>
                      <td className="px-4 py-2 text-sand-500">number</td>
                      <td className="px-4 py-2 text-sand-700">Low severity findings</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">data.supabaseUrl</td>
                      <td className="px-4 py-2 text-sand-500">string</td>
                      <td className="px-4 py-2 text-sand-700">Scanned project URL</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">data.scanUrl</td>
                      <td className="px-4 py-2 text-sand-500">string</td>
                      <td className="px-4 py-2 text-sand-700">Link to the full scan report</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">data.durationMs</td>
                      <td className="px-4 py-2 text-sand-500">number</td>
                      <td className="px-4 py-2 text-sand-700">Scan duration in milliseconds</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">data.previousGrade</td>
                      <td className="px-4 py-2 text-sand-500">string | null</td>
                      <td className="px-4 py-2 text-sand-700">Previous scan grade (scheduled scans only)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-lg font-semibold text-sand-900 mb-3">
                Headers
              </h2>
              <div className="border border-sand-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-sand-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-sand-600 font-medium">Header</th>
                      <th className="text-left px-4 py-2 text-sand-600 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-100">
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">Content-Type</td>
                      <td className="px-4 py-2 text-sand-700">application/json</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">X-Webhook-Signature</td>
                      <td className="px-4 py-2 text-sand-700">HMAC-SHA256 signature: <code className="text-xs">sha256=&lt;hex&gt;</code></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">X-Webhook-Id</td>
                      <td className="px-4 py-2 text-sand-700">Webhook configuration UUID</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">X-Webhook-Event</td>
                      <td className="px-4 py-2 text-sand-700">Event type (e.g. scan.completed)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">X-Webhook-Attempt</td>
                      <td className="px-4 py-2 text-sand-700">Delivery attempt number (1-3)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">User-Agent</td>
                      <td className="px-4 py-2 text-sand-700">SupaScanner-Webhook/1.0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-lg font-semibold text-sand-900 mb-3">
                Signature Verification
              </h2>
              <p className="text-sm text-sand-600 mb-3">
                Every webhook request includes an <code className="font-mono text-xs bg-sand-100 px-1 py-0.5 rounded">X-Webhook-Signature</code> header
                containing an HMAC-SHA256 signature of the request body using your signing secret. Always verify this signature to ensure the request is authentic.
              </p>
              <CodeBlock title="Node.js verification example">{`import crypto from "crypto";

function verifyWebhookSignature(body, signature, secret) {
  const expected = "sha256=" +
    crypto.createHmac("sha256", secret)
      .update(body)
      .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected),
  );
}

// In your request handler:
app.post("/webhook", (req, res) => {
  const signature = req.headers["x-webhook-signature"];
  const rawBody = req.rawBody; // raw string, not parsed JSON

  if (!verifyWebhookSignature(rawBody, signature, YOUR_SECRET)) {
    return res.status(401).send("Invalid signature");
  }

  const payload = JSON.parse(rawBody);
  console.log("Scan grade:", payload.data.grade);
  res.status(200).send("OK");
});`}</CodeBlock>

              <CodeBlock title="Python verification example">{`import hmac
import hashlib

def verify_webhook_signature(body: bytes, signature: str, secret: str) -> bool:
    expected = "sha256=" + hmac.new(
        secret.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(signature, expected)

# In your request handler:
@app.post("/webhook")
def handle_webhook(request):
    signature = request.headers.get("X-Webhook-Signature")
    body = request.body

    if not verify_webhook_signature(body, signature, YOUR_SECRET):
        return Response(status=401)

    payload = json.loads(body)
    print("Scan grade:", payload["data"]["grade"])
    return Response(status=200)`}</CodeBlock>
            </section>

            <section className="mb-10">
              <h2 className="text-lg font-semibold text-sand-900 mb-3">
                Retry Policy
              </h2>
              <p className="text-sm text-sand-600 mb-3">
                Failed deliveries are retried with exponential backoff:
              </p>
              <div className="border border-sand-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-sand-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-sand-600 font-medium">Attempt</th>
                      <th className="text-left px-4 py-2 text-sand-600 font-medium">Delay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-100">
                    <tr>
                      <td className="px-4 py-2">1st (initial)</td>
                      <td className="px-4 py-2 text-sand-700">Immediate</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">2nd retry</td>
                      <td className="px-4 py-2 text-sand-700">~1 second</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">3rd retry (final)</td>
                      <td className="px-4 py-2 text-sand-700">~2 seconds</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-sand-500 mt-3">
                Responses with 4xx status codes are not retried (client error). Only 5xx and network errors trigger retries.
                Each delivery attempt is logged and visible in the Delivery Log on your dashboard.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-lg font-semibold text-sand-900 mb-3">
                Best Practices
              </h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-sand-700">
                <li>Always verify the <code className="font-mono text-xs bg-sand-100 px-1 py-0.5 rounded">X-Webhook-Signature</code> header using a timing-safe comparison</li>
                <li>Return a 2xx response quickly; process the payload asynchronously if needed</li>
                <li>Store your signing secret securely (environment variable, secret manager)</li>
                <li>Use the <strong>Test</strong> button in the dashboard to verify your endpoint before relying on it</li>
                <li>Monitor the Delivery Log for failed deliveries</li>
              </ul>
            </section>
          </article>
        </div>
      </main>
    </>
  );
}
