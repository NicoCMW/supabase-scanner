import { readFile } from "fs/promises";
import { resolve } from "path";

export interface CliConfig {
  readonly url?: string;
  readonly anonKey?: string;
  readonly format?: "json" | "table" | "markdown";
  readonly threshold?: "critical" | "high" | "medium";
}

const CONFIG_FILENAME = ".supascanner.config.json";

export async function loadConfig(cwd: string): Promise<CliConfig> {
  const configPath = resolve(cwd, CONFIG_FILENAME);
  try {
    const raw = await readFile(configPath, "utf-8");
    return JSON.parse(raw) as CliConfig;
  } catch {
    return {};
  }
}

export function resolveTarget(options: {
  readonly url?: string;
  readonly key?: string;
  readonly config: CliConfig;
}): { readonly supabaseUrl: string; readonly anonKey: string } {
  const supabaseUrl =
    options.url ??
    options.config.url ??
    process.env.SUPABASE_URL ??
    "";

  const anonKey =
    options.key ??
    options.config.anonKey ??
    process.env.SUPABASE_ANON_KEY ??
    "";

  if (!supabaseUrl) {
    throw new Error(
      "Supabase URL is required. Provide --url, set SUPABASE_URL, or add it to .supascanner.config.json",
    );
  }

  if (!anonKey) {
    throw new Error(
      "Anon key is required. Provide --key, set SUPABASE_ANON_KEY, or add it to .supascanner.config.json",
    );
  }

  return { supabaseUrl, anonKey };
}
