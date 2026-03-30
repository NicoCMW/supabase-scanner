-- Slack incoming webhook configurations for scan alert notifications
create table if not exists public.slack_webhooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  label text not null default 'My Slack Channel',
  webhook_url text not null,
  channel_name text,
  enabled boolean not null default true,
  notify_scan_complete boolean not null default true,
  notify_critical_finding boolean not null default true,
  notify_score_degradation boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Each user can have multiple webhooks but not duplicate URLs per user
create unique index if not exists slack_webhooks_user_url_idx
  on public.slack_webhooks (user_id, webhook_url);

-- Index for fast lookup during scan notification dispatch
create index if not exists slack_webhooks_user_enabled_idx
  on public.slack_webhooks (user_id)
  where enabled = true;

-- RLS policies
alter table public.slack_webhooks enable row level security;

create policy "Users can view own slack webhooks"
  on public.slack_webhooks for select
  using (auth.uid() = user_id);

create policy "Users can insert own slack webhooks"
  on public.slack_webhooks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own slack webhooks"
  on public.slack_webhooks for update
  using (auth.uid() = user_id);

create policy "Users can delete own slack webhooks"
  on public.slack_webhooks for delete
  using (auth.uid() = user_id);
