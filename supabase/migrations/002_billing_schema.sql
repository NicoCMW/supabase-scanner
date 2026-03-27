-- Billing schema: subscriptions + usage tracking

-- Customers table (maps Supabase auth users to Stripe customers)
create table public.customers (
  id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique not null,
  created_at timestamptz not null default now()
);

-- Subscriptions table
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_subscription_id text unique not null,
  stripe_price_id text not null,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'incomplete')),
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Usage records (monthly scan counts)
create table public.usage_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  scan_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, period_start)
);

-- Indexes
create index idx_customers_stripe_id on public.customers(stripe_customer_id);
create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_stripe_id on public.subscriptions(stripe_subscription_id);
create index idx_usage_records_user_period on public.usage_records(user_id, period_start);

-- RLS policies
alter table public.customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_records enable row level security;

-- Customers: users can view their own customer record
create policy "Users can view own customer"
  on public.customers for select
  using (auth.uid() = id);

-- Subscriptions: users can view their own subscriptions
create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Usage: users can view their own usage
create policy "Users can view own usage"
  on public.usage_records for select
  using (auth.uid() = user_id);

-- Service role can manage all billing tables (for webhook handlers)
-- These use the service role key, which bypasses RLS
