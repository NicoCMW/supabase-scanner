-- Supabase Security Scanner - Initial Schema
-- Uses Supabase Auth for user identity (auth.users)

-- Scan jobs table
create table public.scan_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  supabase_url text not null,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  grade text check (grade in ('A', 'B', 'C', 'D', 'F')),
  total_findings integer not null default 0,
  duration_ms integer,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Findings table
create table public.findings (
  id uuid primary key default gen_random_uuid(),
  scan_job_id uuid not null references public.scan_jobs(id) on delete cascade,
  title text not null,
  description text not null,
  severity text not null check (severity in ('critical', 'high', 'medium', 'low')),
  category text not null check (category in ('rls', 'storage', 'auth')),
  resource text not null,
  details jsonb not null default '{}',
  remediation text not null,
  module text not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_scan_jobs_user_id on public.scan_jobs(user_id);
create index idx_scan_jobs_created_at on public.scan_jobs(created_at desc);
create index idx_findings_scan_job_id on public.findings(scan_job_id);
create index idx_findings_severity on public.findings(severity);

-- RLS policies
alter table public.scan_jobs enable row level security;
alter table public.findings enable row level security;

-- Users can only see their own scan jobs
create policy "Users can view own scan jobs"
  on public.scan_jobs for select
  using (auth.uid() = user_id);

create policy "Users can insert own scan jobs"
  on public.scan_jobs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own scan jobs"
  on public.scan_jobs for update
  using (auth.uid() = user_id);

-- Users can only see findings from their own scan jobs
create policy "Users can view own findings"
  on public.findings for select
  using (
    exists (
      select 1 from public.scan_jobs
      where scan_jobs.id = findings.scan_job_id
      and scan_jobs.user_id = auth.uid()
    )
  );

create policy "Users can insert findings for own scan jobs"
  on public.findings for insert
  with check (
    exists (
      select 1 from public.scan_jobs
      where scan_jobs.id = findings.scan_job_id
      and scan_jobs.user_id = auth.uid()
    )
  );
