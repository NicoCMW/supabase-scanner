-- Fix RLS policy gaps found during security review

-- 1. scan_jobs UPDATE policy: add `with check` to prevent user_id tampering
drop policy "Users can update own scan jobs" on public.scan_jobs;
create policy "Users can update own scan jobs"
  on public.scan_jobs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. No client-side INSERT/UPDATE/DELETE on billing tables.
-- All billing mutations (usage_records, customers, subscriptions) must go
-- through the service role key, which bypasses RLS.
-- This is enforced by design: the only client-side policies are SELECT.
-- Comment explicitly so future reviewers know this is intentional.

-- usage_records: SELECT only (read own usage). Writes via service role.
-- customers: SELECT only (read own customer). Writes via service role.
-- subscriptions: SELECT only (read own subscription). Writes via service role.
