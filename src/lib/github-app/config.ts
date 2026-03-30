import { parse as parseYaml } from "yaml";
import { getInstallationToken } from "./auth";

export interface SupaScannerConfig {
  readonly supabase?: {
    readonly url?: string;
    readonly anon_key?: string;
  };
  readonly rules?: {
    readonly ignore_paths?: readonly string[];
    readonly severity_threshold?: "critical" | "high" | "medium" | "low";
    readonly modules?: readonly ("rls" | "storage" | "auth")[];
  };
}

/**
 * Fetch and parse .supascanner.yml from a repository.
 * Returns null if the file doesn't exist.
 */
export async function fetchRepoConfig(
  installationId: number,
  repoFullName: string,
  ref: string,
): Promise<SupaScannerConfig | null> {
  const token = await getInstallationToken(installationId);

  const response = await fetch(
    `https://api.github.com/repos/${repoFullName}/contents/.supascanner.yml?ref=${ref}`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.raw+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(
      `Failed to fetch .supascanner.yml (${response.status}): ${await response.text()}`,
    );
  }

  const raw = await response.text();
  return validateConfig(parseYaml(raw));
}

function validateConfig(raw: unknown): SupaScannerConfig {
  if (!raw || typeof raw !== "object") return {};

  const config = raw as Record<string, unknown>;
  const result: { supabase?: SupaScannerConfig["supabase"]; rules?: SupaScannerConfig["rules"] } = {};

  if (config.supabase && typeof config.supabase === "object") {
    const s = config.supabase as Record<string, unknown>;
    result.supabase = {
      url: typeof s.url === "string" ? s.url : undefined,
      anon_key: typeof s.anon_key === "string" ? s.anon_key : undefined,
    };
  }

  if (config.rules && typeof config.rules === "object") {
    const r = config.rules as Record<string, unknown>;
    const validSeverities = ["critical", "high", "medium", "low"] as const;
    const validModules = ["rls", "storage", "auth"] as const;

    result.rules = {
      ignore_paths: Array.isArray(r.ignore_paths)
        ? r.ignore_paths.filter((p): p is string => typeof p === "string")
        : undefined,
      severity_threshold:
        typeof r.severity_threshold === "string" &&
        validSeverities.includes(r.severity_threshold as (typeof validSeverities)[number])
          ? (r.severity_threshold as "critical" | "high" | "medium" | "low")
          : undefined,
      modules: Array.isArray(r.modules)
        ? r.modules.filter((m): m is (typeof validModules)[number] =>
            typeof m === "string" && validModules.includes(m as (typeof validModules)[number]),
          )
        : undefined,
    };
  }

  return result;
}
