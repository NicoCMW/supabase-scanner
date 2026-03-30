import type {
  Finding,
  ScanModule,
  ScanModuleResult,
  ScanTarget,
} from "../types";
import { supabaseGet, supabasePost } from "../supabase-client";
import { createFinding } from "../utils";

const COMMON_FUNCTION_NAMES = [
  "hello",
  "webhook",
  "stripe-webhook",
  "send-email",
  "process-payment",
  "notify",
  "cron",
  "sync",
  "api",
  "auth-hook",
  "signup-hook",
  "resize-image",
  "generate",
  "upload",
  "verify",
] as const;

const SECRET_PATTERNS = [
  /(?:api[_-]?key|apikey)\s*[:=]\s*["']?[a-zA-Z0-9_\-]{20,}/i,
  /(?:secret|password|passwd|pwd)\s*[:=]\s*["']?[^\s"']{8,}/i,
  /(?:SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE_KEY)\s*[:=]/i,
  /(?:DATABASE_URL|POSTGRES_URL)\s*[:=]\s*["']?postgres/i,
  /sk_(?:live|test)_[a-zA-Z0-9]{20,}/,
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
  /(?:OPENAI_API_KEY|ANTHROPIC_API_KEY|STRIPE_SECRET)\s*[:=]/i,
] as const;

interface DiscoveredFunction {
  readonly name: string;
  readonly status: number;
  readonly headers: Record<string, string>;
  readonly body: string;
  readonly respondedWithAuth: boolean;
}

async function probeFunction(
  target: ScanTarget,
  name: string,
): Promise<DiscoveredFunction | null> {
  const response = await supabaseGet(target, `/functions/v1/${name}`);

  // 404 means function doesn't exist, skip it
  if (response.status === 404) return null;

  // Any other response means the function exists (200, 401, 403, 500, etc.)
  const body =
    typeof response.data === "string"
      ? response.data
      : JSON.stringify(response.data ?? "");

  return {
    name,
    status: response.status,
    headers: response.headers,
    body,
    respondedWithAuth: response.status === 401 || response.status === 403,
  };
}

async function discoverEdgeFunctions(
  target: ScanTarget,
): Promise<readonly DiscoveredFunction[]> {
  const probes = COMMON_FUNCTION_NAMES.map((name) =>
    probeFunction(target, name),
  );
  const results = await Promise.all(probes);
  return results.filter(
    (r): r is DiscoveredFunction => r !== null,
  );
}

async function checkAuthenticationBypass(
  target: ScanTarget,
  fn: DiscoveredFunction,
): Promise<Finding | null> {
  // If the function responded with 200 using the anon key, check if it also
  // responds without any auth header at all
  if (fn.status !== 200) return null;

  const url = `${target.supabaseUrl}/functions/v1/${fn.name}`;
  let noAuthStatus: number;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    noAuthStatus = response.status;
  } catch {
    return null;
  }

  if (noAuthStatus === 200) {
    return createFinding({
      title: `Edge Function '${fn.name}' accessible without authentication`,
      description: `The Edge Function '${fn.name}' returns a successful response without any Authorization header. Functions processing sensitive logic should verify JWT tokens to ensure only authenticated users can invoke them.`,
      severity: "critical",
      category: "edge-functions",
      resource: `functions/${fn.name}`,
      details: {
        functionName: fn.name,
        noAuthStatusCode: noAuthStatus,
        withAnonKeyStatusCode: fn.status,
      },
      remediation:
        "Add JWT verification to your Edge Function. Use the Supabase client library or manually verify the JWT from the Authorization header:\n\nimport { createClient } from '@supabase/supabase-js'\nconst authHeader = req.headers.get('Authorization')\nif (!authHeader) return new Response('Unauthorized', { status: 401 })\n\nAlternatively, set verify_jwt = true in config.toml for this function.",
      remediationSnippets: [
        {
          label: "Enable JWT verification in config.toml",
          language: "toml",
          code: `[functions.${fn.name}]\nverify_jwt = true`,
        },
        {
          label: "Add JWT verification in function code",
          language: "typescript",
          code: `import { createClient } from 'https://esm.sh/@supabase/supabase-js'\n\nDeno.serve(async (req) => {\n  const authHeader = req.headers.get('Authorization');\n  if (!authHeader) {\n    return new Response(\n      JSON.stringify({ error: 'Missing authorization header' }),\n      { status: 401, headers: { 'Content-Type': 'application/json' } }\n    );\n  }\n\n  const supabase = createClient(\n    Deno.env.get('SUPABASE_URL')!,\n    Deno.env.get('SUPABASE_ANON_KEY')!,\n    { global: { headers: { Authorization: authHeader } } }\n  );\n\n  const { data: { user }, error } = await supabase.auth.getUser();\n  if (error || !user) {\n    return new Response(\n      JSON.stringify({ error: 'Invalid token' }),\n      { status: 401 }\n    );\n  }\n\n  // Proceed with authenticated request...\n});`,
        },
      ],
    });
  }

  return null;
}

async function checkCorsConfiguration(
  target: ScanTarget,
  fn: DiscoveredFunction,
): Promise<Finding | null> {
  const corsOrigin =
    fn.headers["access-control-allow-origin"] ?? null;

  if (corsOrigin === "*") {
    return createFinding({
      title: `Edge Function '${fn.name}' has wildcard CORS origin`,
      description: `The Edge Function '${fn.name}' returns Access-Control-Allow-Origin: * which allows any website to make requests to this function. This can expose your function to cross-site request attacks if it processes sensitive data or performs state-changing operations.`,
      severity: "high",
      category: "edge-functions",
      resource: `functions/${fn.name}`,
      details: {
        functionName: fn.name,
        corsOrigin: "*",
        allCorsHeaders: {
          allowOrigin: corsOrigin,
          allowMethods:
            fn.headers["access-control-allow-methods"] ?? null,
          allowHeaders:
            fn.headers["access-control-allow-headers"] ?? null,
        },
      },
      remediation:
        "Restrict the Access-Control-Allow-Origin header to your specific domains instead of using a wildcard. In your Edge Function:\n\nconst corsHeaders = {\n  'Access-Control-Allow-Origin': 'https://yourdomain.com',\n  'Access-Control-Allow-Methods': 'POST, OPTIONS',\n  'Access-Control-Allow-Headers': 'authorization, content-type',\n}",
      remediationSnippets: [
        {
          label: "Set restrictive CORS headers",
          language: "typescript",
          code: `const corsHeaders = {\n  'Access-Control-Allow-Origin': 'https://yourdomain.com',\n  'Access-Control-Allow-Methods': 'POST, OPTIONS',\n  'Access-Control-Allow-Headers': 'authorization, content-type',\n};\n\nDeno.serve(async (req) => {\n  if (req.method === 'OPTIONS') {\n    return new Response(null, { headers: corsHeaders });\n  }\n\n  // Your function logic here...\n  return new Response(\n    JSON.stringify({ ok: true }),\n    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }\n  );\n});`,
        },
      ],
    });
  }

  return null;
}

function checkSecretLeakage(
  fn: DiscoveredFunction,
): Finding | null {
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(fn.body)) {
      return createFinding({
        title: `Edge Function '${fn.name}' may expose secrets in response`,
        description: `The Edge Function '${fn.name}' response body contains patterns that match known secret or credential formats. This could indicate hardcoded secrets being leaked through error messages or debug output rather than being stored securely in Supabase Vault or environment variables.`,
        severity: "critical",
        category: "edge-functions",
        resource: `functions/${fn.name}`,
        details: {
          functionName: fn.name,
          patternMatched: true,
          responseStatusCode: fn.status,
        },
        remediation:
          "Never hardcode secrets in Edge Function source code. Use Supabase Vault or Edge Function Secrets:\n\n1. Store secrets: supabase secrets set MY_SECRET=value\n2. Access in code: Deno.env.get('MY_SECRET')\n3. Ensure error handlers do not expose environment variables or stack traces in responses.\n4. Review function code for any console.log or Response body that includes secrets.",
        remediationSnippets: [
          {
            label: "Store secrets via Supabase CLI",
            language: "bash",
            code: `# Set secrets for Edge Functions\nsupabase secrets set MY_API_KEY=your-secret-value\nsupabase secrets set STRIPE_SECRET=sk_live_xxx\n\n# List current secrets\nsupabase secrets list`,
          },
          {
            label: "Access secrets safely in Edge Function",
            language: "typescript",
            code: `// Access secrets from environment variables\nconst apiKey = Deno.env.get('MY_API_KEY');\nif (!apiKey) {\n  // Log error internally, return generic message\n  console.error('MY_API_KEY not configured');\n  return new Response(\n    JSON.stringify({ error: 'Server configuration error' }),\n    { status: 500 }\n  );\n}`,
          },
        ],
      });
    }
  }

  return null;
}

async function checkInvocationPermissions(
  fn: DiscoveredFunction,
): Promise<Finding | null> {
  // If the function responded 200 with the anon key, it means anonymous
  // (unauthenticated user-level) invocation is allowed
  if (fn.status === 200 && !fn.respondedWithAuth) {
    return createFinding({
      title: `Edge Function '${fn.name}' invocable with anonymous key`,
      description: `The Edge Function '${fn.name}' successfully executes when called with only the project's anon key. If this function performs privileged operations (database writes, external API calls, email sending), it should require authenticated user JWTs rather than accepting the public anon key.`,
      severity: "medium",
      category: "edge-functions",
      resource: `functions/${fn.name}`,
      details: {
        functionName: fn.name,
        anonKeyAccepted: true,
        statusCode: fn.status,
      },
      remediation:
        "Configure the function to require authenticated users by setting verify_jwt = true in supabase/config.toml:\n\n[functions.your-function]\nverify_jwt = true\n\nThen in the function, extract the user from the JWT to authorize the request.",
      remediationSnippets: [
        {
          label: "Require JWT in config.toml",
          language: "toml",
          code: `[functions.${fn.name}]\nverify_jwt = true`,
        },
        {
          label: "Extract and verify user in function",
          language: "typescript",
          code: `import { createClient } from 'https://esm.sh/@supabase/supabase-js'\n\nDeno.serve(async (req) => {\n  const supabase = createClient(\n    Deno.env.get('SUPABASE_URL')!,\n    Deno.env.get('SUPABASE_ANON_KEY')!,\n    {\n      global: {\n        headers: { Authorization: req.headers.get('Authorization')! },\n      },\n    }\n  );\n\n  const { data: { user } } = await supabase.auth.getUser();\n  if (!user) {\n    return new Response('Unauthorized', { status: 401 });\n  }\n\n  // user is now verified - proceed with logic\n});`,
        },
      ],
    });
  }

  return null;
}

async function checkRateLimiting(
  target: ScanTarget,
  fn: DiscoveredFunction,
): Promise<Finding | null> {
  // Only test rate limiting on functions that are accessible
  if (fn.status === 401 || fn.status === 403) return null;

  const requests = Array.from({ length: 8 }, () =>
    supabaseGet(target, `/functions/v1/${fn.name}`),
  );

  const responses = await Promise.all(requests);
  const rateLimited = responses.some((r) => r.status === 429);

  if (!rateLimited) {
    const allSucceeded = responses.every(
      (r) => r.status < 400 || r.status === 500,
    );

    if (allSucceeded) {
      return createFinding({
        title: `Edge Function '${fn.name}' may lack rate limiting`,
        description: `Eight rapid requests to Edge Function '${fn.name}' were all processed without any rate limiting (no 429 responses). Without rate limiting, the function is vulnerable to abuse, denial-of-service attacks, and cost inflation from excessive invocations.`,
        severity: "medium",
        category: "edge-functions",
        resource: `functions/${fn.name}`,
        details: {
          functionName: fn.name,
          requestCount: responses.length,
          allProcessed: true,
          statusCodes: responses.map((r) => r.status),
        },
        remediation:
          "Implement rate limiting for your Edge Function. Options include:\n\n1. Use Supabase's built-in rate limiting if available\n2. Implement token bucket or sliding window rate limiting in the function using Supabase KV or a counter table\n3. Use an API gateway or CDN-level rate limiting in front of your functions\n4. Track invocations per IP/user in a Supabase table and reject excess requests.",
        remediationSnippets: [
          {
            label: "Simple rate limiting with Supabase table",
            language: "sql",
            code: `-- Create a rate limit tracking table\nCREATE TABLE rate_limits (\n  key text PRIMARY KEY,\n  count integer DEFAULT 1,\n  window_start timestamptz DEFAULT now()\n);\n\nALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;`,
          },
          {
            label: "Check rate limit in Edge Function",
            language: "typescript",
            code: `async function checkRateLimit(\n  supabase: SupabaseClient,\n  key: string,\n  maxRequests = 10,\n  windowSeconds = 60\n): Promise<boolean> {\n  const windowStart = new Date(\n    Date.now() - windowSeconds * 1000\n  ).toISOString();\n\n  const { data } = await supabase\n    .from('rate_limits')\n    .select('count')\n    .eq('key', key)\n    .gte('window_start', windowStart)\n    .single();\n\n  return !data || data.count < maxRequests;\n}`,
          },
        ],
      });
    }
  }

  return null;
}

async function checkVerboseErrors(
  fn: DiscoveredFunction,
): Promise<Finding | null> {
  // Check if error responses contain stack traces or internal paths
  if (fn.status < 400) return null;

  const hasStackTrace =
    /at\s+\S+\s+\(.*:\d+:\d+\)/.test(fn.body) ||
    /\.ts:\d+:\d+/.test(fn.body) ||
    /Deno\./.test(fn.body);

  const hasInternalPaths =
    /\/home\/deno\//.test(fn.body) ||
    /\/var\/task\//.test(fn.body) ||
    /file:\/\/\//.test(fn.body);

  if (hasStackTrace || hasInternalPaths) {
    return createFinding({
      title: `Edge Function '${fn.name}' exposes internal details in error responses`,
      description: `The Edge Function '${fn.name}' returns error responses containing stack traces or internal file paths. This information disclosure helps attackers understand the function's implementation, dependencies, and runtime environment.`,
      severity: "high",
      category: "edge-functions",
      resource: `functions/${fn.name}`,
      details: {
        functionName: fn.name,
        hasStackTrace,
        hasInternalPaths,
        statusCode: fn.status,
      },
      remediation:
        "Wrap your Edge Function logic in a try-catch block and return generic error messages:\n\ntry {\n  // function logic\n} catch (error) {\n  console.error(error) // Log internally only\n  return new Response(\n    JSON.stringify({ error: 'Internal server error' }),\n    { status: 500 }\n  )\n}",
      remediationSnippets: [
        {
          label: "Add safe error handling",
          language: "typescript",
          code: `Deno.serve(async (req) => {\n  try {\n    // Your function logic here\n    return new Response(\n      JSON.stringify({ ok: true }),\n      { status: 200, headers: { 'Content-Type': 'application/json' } }\n    );\n  } catch (error) {\n    // Log details internally only\n    console.error('Function error:', error);\n    // Return generic message to client\n    return new Response(\n      JSON.stringify({ error: 'Internal server error' }),\n      { status: 500, headers: { 'Content-Type': 'application/json' } }\n    );\n  }\n});`,
        },
      ],
    });
  }

  return null;
}

export const edgeFunctionsAuditModule: ScanModule = {
  name: "Edge Functions Audit",

  async run(target: ScanTarget): Promise<ScanModuleResult> {
    const start = Date.now();
    const findings: Finding[] = [];

    const functions = await discoverEdgeFunctions(target);

    if (functions.length === 0) {
      return {
        module: "Edge Functions Audit",
        findings: [],
        scannedAt: new Date().toISOString(),
        durationMs: Date.now() - start,
      };
    }

    const checks: Promise<Finding | null>[] = [];

    for (const fn of functions) {
      checks.push(
        checkAuthenticationBypass(target, fn),
        checkCorsConfiguration(target, fn),
        Promise.resolve(checkSecretLeakage(fn)),
        checkInvocationPermissions(fn),
        checkRateLimiting(target, fn),
        checkVerboseErrors(fn),
      );
    }

    const results = await Promise.all(checks);

    for (const finding of results) {
      if (finding) {
        findings.push(finding);
      }
    }

    return {
      module: "Edge Functions Audit",
      findings,
      scannedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
    };
  },
};
