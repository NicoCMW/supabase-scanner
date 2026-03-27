-- Shared scan results for social sharing
-- Stores a public, privacy-safe snapshot of scan grades

create table public.shared_results (
  id uuid primary key default gen_random_uuid(),
  share_id text not null unique,
  scan_job_id uuid not null references public.scan_jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  grade text not null check (grade in ('A', 'B', 'C', 'D', 'F')),
  scan_date timestamptz not null,
  critical_count integer not null default 0,
  high_count integer not null default 0,
  medium_count integer not null default 0,
  low_count integer not null default 0,
  total_findings integer not null default 0,
  created_at timestamptz not null default now()
);

-- Index for fast share_id lookups (public page)
create index idx_shared_results_share_id on public.shared_results(share_id);

-- Index for checking existing shares per scan job
create index idx_shared_results_scan_job_id on public.shared_results(scan_job_id);

-- RLS
alter table public.shared_results enable row level security;

-- Anyone can view shared results (public page)
create policy "Anyone can view shared results"
  on public.shared_results for select
  using (true);

-- Only the scan owner can create a share
create policy "Users can share own scan results"
  on public.shared_results for insert
  with check (auth.uid() = user_id);
