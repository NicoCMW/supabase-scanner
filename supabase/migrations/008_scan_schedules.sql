-- Scan schedules for recurring automated scans (Pro users only)
-- Stores encrypted anon keys for unattended scan execution

create table public.scan_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  supabase_url text not null,
  encrypted_anon_key text not null,
  frequency text not null check (frequency in ('weekly', 'monthly')),
  enabled boolean not null default true,
  next_run_at timestamptz not null,
  last_run_at timestamptz,
  last_scan_job_id uuid references public.scan_jobs(id) on delete set null,
  consecutive_failures integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Each user can have one schedule per Supabase URL
create unique index idx_scan_schedules_user_url
  on public.scan_schedules(user_id, supabase_url);

-- Fast lookup for the cron runner: enabled schedules due for execution
create index idx_scan_schedules_next_run
  on public.scan_schedules(next_run_at)
  where enabled = true;

create index idx_scan_schedules_user_id
  on public.scan_schedules(user_id);

-- Add scheduled_scan_email preference to email_preferences
alter table public.email_preferences
  add column scheduled_scan_email boolean not null default true;

-- RLS policies
alter table public.scan_schedules enable row level security;

create policy "Users can view own scan schedules"
  on public.scan_schedules for select
  using (auth.uid() = user_id);

create policy "Users can insert own scan schedules"
  on public.scan_schedules for insert
  with check (auth.uid() = user_id);

create policy "Users can update own scan schedules"
  on public.scan_schedules for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own scan schedules"
  on public.scan_schedules for delete
  using (auth.uid() = user_id);
