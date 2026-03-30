-- GitHub App installations linked to SupaScanner users
create table if not exists public.github_installations (
  id uuid primary key default gen_random_uuid(),
  installation_id bigint not null unique,
  account_login text not null,
  account_type text not null check (account_type in ('User', 'Organization')),
  user_id uuid references auth.users(id) on delete set null,
  supabase_url text,
  encrypted_anon_key text,
  scans_this_month int not null default 0,
  month_period date not null default date_trunc('month', now())::date,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast lookup by installation_id (GitHub webhook path)
create index if not exists idx_github_installations_installation_id
  on public.github_installations (installation_id);

-- Index for user dashboard queries
create index if not exists idx_github_installations_user_id
  on public.github_installations (user_id);

-- Track per-PR scan history for dedup and linking
create table if not exists public.github_pr_scans (
  id uuid primary key default gen_random_uuid(),
  installation_id bigint not null references public.github_installations(installation_id) on delete cascade,
  repo_full_name text not null,
  pr_number int not null,
  head_sha text not null,
  comment_id bigint,
  scan_job_id uuid references public.scan_jobs(id) on delete set null,
  grade text check (grade in ('A', 'B', 'C', 'D', 'F')),
  total_findings int not null default 0,
  created_at timestamptz not null default now()
);

-- Dedup: one scan per SHA per PR
create unique index if not exists idx_github_pr_scans_dedup
  on public.github_pr_scans (installation_id, repo_full_name, pr_number, head_sha);

-- RLS
alter table public.github_installations enable row level security;
alter table public.github_pr_scans enable row level security;

-- Users can view their own installations
create policy github_installations_select on public.github_installations
  for select using (auth.uid() = user_id);

-- Users can update their own installations (configure supabase url/key)
create policy github_installations_update on public.github_installations
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own installations
create policy github_installations_delete on public.github_installations
  for delete using (auth.uid() = user_id);

-- PR scans visible to installation owner
create policy github_pr_scans_select on public.github_pr_scans
  for select using (
    exists (
      select 1 from public.github_installations gi
      where gi.installation_id = github_pr_scans.installation_id
        and gi.user_id = auth.uid()
    )
  );
