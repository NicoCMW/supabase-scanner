-- Email preferences for transactional emails
-- Tracks per-user opt-in/out for each email type

create table public.email_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  welcome_email boolean not null default true,
  scan_results_email boolean not null default true,
  weekly_digest_email boolean not null default true,
  unsubscribe_token text not null default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- Index for fast lookup by user and unsubscribe token
create index idx_email_preferences_user_id on public.email_preferences(user_id);
create unique index idx_email_preferences_unsubscribe_token on public.email_preferences(unsubscribe_token);

-- RLS policies
alter table public.email_preferences enable row level security;

-- Users can view their own preferences
create policy "Users can view own email preferences"
  on public.email_preferences for select
  using (auth.uid() = user_id);

-- Users can update their own preferences
create policy "Users can update own email preferences"
  on public.email_preferences for update
  using (auth.uid() = user_id);

-- Users can insert their own preferences
create policy "Users can insert own email preferences"
  on public.email_preferences for insert
  with check (auth.uid() = user_id);
