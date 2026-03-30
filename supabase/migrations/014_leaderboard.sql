-- Public security leaderboard: opt-in rankings for gamified engagement
-- Users can choose to list their shared results on the public leaderboard

create table public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  shared_result_id uuid not null references public.shared_results(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default 'Anonymous Project',
  grade text not null check (grade in ('A', 'B', 'C', 'D', 'F')),
  total_findings integer not null default 0,
  critical_count integer not null default 0,
  high_count integer not null default 0,
  medium_count integer not null default 0,
  low_count integer not null default 0,
  scan_date timestamptz not null,
  share_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint unique_user_leaderboard unique (user_id)
);

-- Index for ranking queries (grade sort, then fewest findings)
create index idx_leaderboard_ranking on public.leaderboard_entries(grade asc, total_findings asc);

-- Index for looking up a user's entry
create index idx_leaderboard_user on public.leaderboard_entries(user_id);

-- RLS
alter table public.leaderboard_entries enable row level security;

-- Anyone can view leaderboard entries (public page)
create policy "Anyone can view leaderboard"
  on public.leaderboard_entries for select
  using (true);

-- Only the owner can insert their own entry
create policy "Users can add own leaderboard entry"
  on public.leaderboard_entries for insert
  with check (auth.uid() = user_id);

-- Only the owner can update their own entry
create policy "Users can update own leaderboard entry"
  on public.leaderboard_entries for update
  using (auth.uid() = user_id);

-- Only the owner can remove their own entry
create policy "Users can delete own leaderboard entry"
  on public.leaderboard_entries for delete
  using (auth.uid() = user_id);

-- Weekly "most improved" tracking view
-- Compares current grade vs grade from 7 days ago for users on the leaderboard
create or replace function public.leaderboard_stats()
returns json
language sql
stable
security definer
as $$
  select json_build_object(
    'totalEntries', (select count(*) from public.leaderboard_entries),
    'gradeDistribution', (
      select json_object_agg(grade, cnt)
      from (
        select grade, count(*) as cnt
        from public.leaderboard_entries
        group by grade
      ) g
    ),
    'recentEntries', (
      select count(*)
      from public.leaderboard_entries
      where created_at > now() - interval '7 days'
    )
  );
$$;
