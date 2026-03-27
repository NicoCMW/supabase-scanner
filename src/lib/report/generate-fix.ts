import type { Finding } from "@/types/scanner";

export interface FixExplanation {
  readonly findingId: string;
  readonly explanation: string;
  readonly sqlSnippet: string | null;
  readonly steps: readonly string[];
}

/**
 * Generate a fix explanation for a finding using Claude API.
 * Falls back to a static explanation if the API is unavailable.
 */
export async function generateFixExplanation(
  finding: Finding,
): Promise<FixExplanation> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return buildStaticFix(finding);
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6-20250327",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: buildPrompt(finding),
          },
        ],
      }),
    });

    if (!response.ok) {
      return buildStaticFix(finding);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
    };

    const text =
      data.content.find((c) => c.type === "text")?.text ?? "";

    return parseClaudeResponse(finding.id, text);
  } catch {
    return buildStaticFix(finding);
  }
}

/**
 * Generate fixes for multiple findings in batch.
 */
export async function generateFixExplanations(
  findings: readonly Finding[],
): Promise<readonly FixExplanation[]> {
  return Promise.all(findings.map(generateFixExplanation));
}

function buildPrompt(finding: Finding): string {
  return `You are a Supabase security expert. A security scan found the following issue:

Title: ${finding.title}
Severity: ${finding.severity}
Category: ${finding.category}
Resource: ${finding.resource}
Description: ${finding.description}

Provide a fix in this exact JSON format (no markdown, just JSON):
{
  "explanation": "Brief explanation of why this is a security risk and how to fix it",
  "sqlSnippet": "SQL command to fix the issue, or null if not applicable",
  "steps": ["Step 1", "Step 2", "Step 3"]
}

Keep the explanation concise (2-3 sentences). The SQL should be copy-paste ready. Steps should be actionable.`;
}

function parseClaudeResponse(
  findingId: string,
  text: string,
): FixExplanation {
  try {
    const parsed = JSON.parse(text) as {
      explanation: string;
      sqlSnippet: string | null;
      steps: string[];
    };

    return {
      findingId,
      explanation: parsed.explanation,
      sqlSnippet: parsed.sqlSnippet,
      steps: parsed.steps,
    };
  } catch {
    // If Claude didn't return valid JSON, extract what we can
    return {
      findingId,
      explanation: text.slice(0, 500),
      sqlSnippet: null,
      steps: ["Review the finding details and apply the recommended remediation."],
    };
  }
}

function buildStaticFix(finding: Finding): FixExplanation {
  const sqlSnippets: Record<string, string> = {
    rls: `-- Enable RLS on the affected table\nALTER TABLE ${finding.resource} ENABLE ROW LEVEL SECURITY;\n\n-- Create a restrictive policy\nCREATE POLICY "authenticated_access" ON ${finding.resource}\n  FOR ALL\n  TO authenticated\n  USING (auth.uid() = user_id);`,
    storage: `-- Restrict storage bucket access\nCREATE POLICY "authenticated_storage" ON storage.objects\n  FOR ALL\n  TO authenticated\n  USING (bucket_id = '${finding.resource.replace("storage/", "")}');`,
    auth: "",
  };

  return {
    findingId: finding.id,
    explanation: finding.description,
    sqlSnippet: sqlSnippets[finding.category] || null,
    steps: [finding.remediation],
  };
}
