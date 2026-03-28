-- Team workspaces: multi-tenant team management with role-based access
-- Adds teams, team members, team projects, and links scans to team projects

-- ============================================================
-- Tables
-- ============================================================

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member', 'viewer')),
  invited_by uuid not null references auth.users(id),
  invite_token text unique,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(team_id, email)
);

create table public.team_projects (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  supabase_url text not null,
  last_scan_grade text check (last_scan_grade in ('A', 'B', 'C', 'D', 'F')),
  last_scan_at timestamptz,
  last_scan_job_id uuid references public.scan_jobs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(team_id, supabase_url)
);

-- ============================================================
-- Alter existing tables
-- ============================================================

alter table public.scan_jobs
  add column team_project_id uuid references public.team_projects(id) on delete set null;

-- ============================================================
-- Helper function
-- ============================================================

create function public.user_team_role(p_team_id uuid)
returns text as $$
  select role from public.team_members
  where team_id = p_team_id
    and user_id = auth.uid()
    and accepted_at is not null
  limit 1;
$$ language sql security definer stable;

-- ============================================================
-- Indexes
-- ============================================================

create index idx_team_members_team_id on public.team_members(team_id);
create index idx_team_members_user_id on public.team_members(user_id);
create index idx_team_projects_team_id on public.team_projects(team_id);
create index idx_scan_jobs_team_project_id on public.scan_jobs(team_project_id);

-- ============================================================
-- RLS: teams
-- ============================================================

alter table public.teams enable row level security;

create policy "Team members can view their teams"
  on public.teams for select
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = teams.id
        and team_members.user_id = auth.uid()
        and team_members.accepted_at is not null
    )
  );

create policy "Authenticated users can create teams"
  on public.teams for insert
  with check (auth.uid() is not null);

create policy "Team admins and owners can update teams"
  on public.teams for update
  using (
    owner_id = auth.uid()
    or public.user_team_role(id) = 'admin'
  )
  with check (
    owner_id = auth.uid()
    or public.user_team_role(id) = 'admin'
  );

create policy "Only team owner can delete teams"
  on public.teams for delete
  using (owner_id = auth.uid());

-- ============================================================
-- RLS: team_members
-- ============================================================

alter table public.team_members enable row level security;

create policy "Team members can view team membership"
  on public.team_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.team_members as tm
      where tm.team_id = team_members.team_id
        and tm.user_id = auth.uid()
        and tm.accepted_at is not null
    )
  );

create policy "Team admins and owners can insert members"
  on public.team_members for insert
  with check (
    exists (
      select 1 from public.teams
      where teams.id = team_members.team_id
        and (
          teams.owner_id = auth.uid()
          or public.user_team_role(teams.id) = 'admin'
        )
    )
  );

create policy "Team admins and owners can update members"
  on public.team_members for update
  using (
    exists (
      select 1 from public.teams
      where teams.id = team_members.team_id
        and (
          teams.owner_id = auth.uid()
          or public.user_team_role(teams.id) = 'admin'
        )
    )
  )
  with check (
    exists (
      select 1 from public.teams
      where teams.id = team_members.team_id
        and (
          teams.owner_id = auth.uid()
          or public.user_team_role(teams.id) = 'admin'
        )
    )
  );

create policy "Team admins and owners can delete members"
  on public.team_members for delete
  using (
    exists (
      select 1 from public.teams
      where teams.id = team_members.team_id
        and (
          teams.owner_id = auth.uid()
          or public.user_team_role(teams.id) = 'admin'
        )
    )
  );

-- ============================================================
-- RLS: team_projects
-- ============================================================

alter table public.team_projects enable row level security;

create policy "Team members can view team projects"
  on public.team_projects for select
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = team_projects.team_id
        and team_members.user_id = auth.uid()
        and team_members.accepted_at is not null
    )
  );

create policy "Team admins and members can insert projects"
  on public.team_projects for insert
  with check (
    public.user_team_role(team_id) in ('admin', 'member')
  );

create policy "Team admins and members can update projects"
  on public.team_projects for update
  using (
    public.user_team_role(team_id) in ('admin', 'member')
  )
  with check (
    public.user_team_role(team_id) in ('admin', 'member')
  );

create policy "Team admins and members can delete projects"
  on public.team_projects for delete
  using (
    public.user_team_role(team_id) in ('admin', 'member')
  );

-- ============================================================
-- Update scan_jobs SELECT policy to include team access
-- ============================================================

drop policy "Users can view own scan jobs" on public.scan_jobs;
create policy "Users can view own or team scan jobs"
  on public.scan_jobs for select
  using (
    auth.uid() = user_id
    or (
      team_project_id is not null
      and exists (
        select 1 from public.team_projects
        join public.team_members on team_members.team_id = team_projects.team_id
        where team_projects.id = scan_jobs.team_project_id
          and team_members.user_id = auth.uid()
          and team_members.accepted_at is not null
      )
    )
  );

-- Update findings SELECT policy to include team access
drop policy "Users can view own findings" on public.findings;
create policy "Users can view own or team findings"
  on public.findings for select
  using (
    exists (
      select 1 from public.scan_jobs
      where scan_jobs.id = findings.scan_job_id
        and (
          scan_jobs.user_id = auth.uid()
          or (
            scan_jobs.team_project_id is not null
            and exists (
              select 1 from public.team_projects
              join public.team_members on team_members.team_id = team_projects.team_id
              where team_projects.id = scan_jobs.team_project_id
                and team_members.user_id = auth.uid()
                and team_members.accepted_at is not null
            )
          )
        )
    )
  );
