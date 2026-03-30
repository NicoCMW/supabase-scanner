-- Generic webhook configurations for scan notifications (Discord, PagerDuty, Zapier, etc.)
create table if not exists public.webhooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.team_projects(id) on delete cascade,
  label text not null default 'My Webhook',
  url text not null,
  secret text not null,
  enabled boolean not null default true,
  notify_scan_complete boolean not null default true,
  notify_critical_finding boolean not null default true,
  notify_score_degradation boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Each user can have multiple webhooks but not duplicate URLs per user
create unique index if not exists webhooks_user_url_idx
  on public.webhooks (user_id, url);

-- Index for fast lookup during scan notification dispatch
create index if not exists webhooks_user_enabled_idx
  on public.webhooks (user_id)
  where enabled = true;

-- Webhook delivery logs for debugging
create table if not exists public.webhook_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.webhooks(id) on delete cascade,
  scan_job_id uuid references public.scan_jobs(id) on delete set null,
  event_type text not null default 'scan.completed',
  request_url text not null,
  request_body jsonb not null,
  response_status integer,
  response_body text,
  success boolean not null default false,
  attempt integer not null default 1,
  error_message text,
  created_at timestamptz not null default now()
);

-- Index for fetching delivery logs per webhook
create index if not exists webhook_delivery_logs_webhook_idx
  on public.webhook_delivery_logs (webhook_id, created_at desc);

-- RLS policies for webhooks
alter table public.webhooks enable row level security;

create policy "Users can view own webhooks"
  on public.webhooks for select
  using (auth.uid() = user_id);

create policy "Users can insert own webhooks"
  on public.webhooks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own webhooks"
  on public.webhooks for update
  using (auth.uid() = user_id);

create policy "Users can delete own webhooks"
  on public.webhooks for delete
  using (auth.uid() = user_id);

-- RLS policies for webhook delivery logs
alter table public.webhook_delivery_logs enable row level security;

create policy "Users can view delivery logs for own webhooks"
  on public.webhook_delivery_logs for select
  using (
    exists (
      select 1 from public.webhooks w
      where w.id = webhook_id and w.user_id = auth.uid()
    )
  );
