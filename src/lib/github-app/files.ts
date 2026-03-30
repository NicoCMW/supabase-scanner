/**
 * Patterns that indicate Supabase-related changes in a PR.
 */
const SUPABASE_PATTERNS: readonly RegExp[] = [
  /^\.env/,                          // .env, .env.local, .env.production, etc.
  /^supabase\//,                     // supabase/ directory
  /\.sql$/,                          // any SQL file
  /\/policies\//,                    // RLS policies directory
  /\/migrations\//,                  // migration files
  /rls/i,                            // any file with "rls" in the name
  /^\.supascanner\.yml$/,            // config file itself
  /supabase/i,                       // any path mentioning supabase
];

/**
 * Check if a filename matches Supabase-related patterns.
 */
function isSupabaseFile(filename: string): boolean {
  return SUPABASE_PATTERNS.some((pattern) => pattern.test(filename));
}

/**
 * Filter PR changed files to only those that are Supabase-related.
 * Returns the matching filenames.
 */
export function filterSupabaseFiles(filenames: readonly string[]): string[] {
  return filenames.filter(isSupabaseFile);
}

/**
 * Check if any files in a PR touch Supabase-related paths.
 */
export function hasSupabaseChanges(filenames: readonly string[]): boolean {
  return filenames.some(isSupabaseFile);
}
