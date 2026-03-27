import { createClient } from "@supabase/supabase-js";

/**
 * Service role client for server-side mutations that bypass RLS.
 * Use only in API routes for privileged operations (billing, usage tracking).
 * Never expose to the client.
 */
export function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
