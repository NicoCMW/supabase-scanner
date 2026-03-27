-- Waitlist table for email capture on the landing page
-- Stores emails from visitors who want to be notified at launch

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'landing_page',
  created_at timestamptz not null default now(),
  unique(email)
);

-- Index for fast duplicate checks
create unique index idx_waitlist_email on public.waitlist(email);

-- RLS: no authenticated user access needed, only service role inserts
alter table public.waitlist enable row level security;
