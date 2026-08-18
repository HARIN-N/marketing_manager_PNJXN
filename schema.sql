-- ============================================================================
-- MARKETING OS — TARGET SUPABASE SCHEMA
-- ----------------------------------------------------------------------------
-- This is the schema the app is DESIGNED for, matching the shape of js/db.js.
-- It is not yet wired into the running app (see README "Connecting Supabase").
-- Run this in the Supabase SQL editor, then policies.sql, then seed.sql.
--
-- Design principle: clients are configurable workspaces, not hardcoded rows.
-- Nothing here references a specific client by name or industry.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "moddatetime" schema extensions;

-- ---------------------------------------------------------------------------
-- Agency-level identity
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('Admin','Manager','Account Manager','Content Strategist','Designer','SEO','Performance Marketing','Intern','Client')),
  department text,
  email text not null,
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Clients as configurable workspaces
-- ---------------------------------------------------------------------------
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text not null,
  business_type text,
  logo_url text,
  status text not null default 'Onboarding' check (status in ('Active','Onboarding','Paused')),
  services text[] not null default '{}',       -- configurable, not an enum: new services never need a migration
  platforms text[] not null default '{}',
  target_audience text,
  goals text[] not null default '{}',
  website text,
  social jsonb not null default '{}',           -- { instagram, facebook, linkedin, youtube }
  location text,
  timezone text default 'UTC',
  account_manager uuid references profiles(id),
  content_manager uuid references profiles(id),
  designer uuid references profiles(id),
  seo_manager uuid references profiles(id),
  ads_manager uuid references profiles(id),
  contact_name text,
  contact_email text,
  contact_phone text,
  notes text,
  reporting_frequency text default 'Monthly',
  approval_workflow text default 'Standard',
  start_date date default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Extensible per-client metadata, so one industry's fields never pollute another's schema.
create table client_custom_fields (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  label text not null,
  value text,
  created_at timestamptz not null default now()
);

-- Who on the team can see/work on which client (drives RLS).
create table client_members (
  client_id uuid not null references clients(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role_on_client text,
  primary key (client_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Brand Brain (one per client, strictly scoped)
-- ---------------------------------------------------------------------------
create table brand_brain (
  client_id uuid primary key references clients(id) on delete cascade,
  personality text,
  tone text[] default '{}',
  writing_style text,
  target_audience text,
  brand_story text,
  core_messaging text,
  key_phrases text[] default '{}',
  words_to_use text[] default '{}',
  words_to_avoid text[] default '{}',
  content_pillars text[] default '{}',
  visual_direction text,
  competitors text[] default '{}',
  brand_colors text[] default '{}',
  special_instructions text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Campaigns (created before content/tasks so their foreign keys resolve)
-- ---------------------------------------------------------------------------
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  status text default 'PLANNED',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Content & approvals
-- ---------------------------------------------------------------------------
create table content (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  title text not null,
  type text not null,          -- Static Post, Carousel, Reel, Story, Blog, LinkedIn Post, GBP Post, Ad — configurable
  platform text not null,
  topic text,
  campaign_id uuid references campaigns(id),
  caption text,
  creative_file_url text,
  creative_link text,
  hashtags text,
  cta text,
  publish_date date,
  assigned_to uuid references profiles(id),
  status text not null default 'IDEA',   -- driven by the client's configured workflow_stages, see workflow_stages table
  priority text not null default 'MEDIUM' check (priority in ('LOW','MEDIUM','HIGH','URGENT')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_content_client on content(client_id);
create index idx_content_status on content(status);
create index idx_content_publish_date on content(publish_date);

create table content_revisions (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references content(id) on delete cascade,
  snapshot jsonb not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references content(id) on delete cascade,
  user_id uuid references profiles(id),
  message text not null,
  parent_comment_id uuid references comments(id),
  created_at timestamptz not null default now()
);

create table approvals (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references content(id) on delete cascade,
  status text not null default 'Pending' check (status in ('Pending','Approved','Changes Requested','Rejected')),
  submitted_by uuid references profiles(id),
  submitted_at timestamptz not null default now(),
  decided_at timestamptz
);

create table approval_history (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references content(id) on delete cascade,
  action text not null,
  note text,
  actor uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- Per-client configurable approval/content workflow stages (spec section 56).
create table workflow_stages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  stage_name text not null,
  stage_order int not null
);

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------
create table tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,   -- nullable: internal/agency tasks
  title text not null,
  description text,
  category text not null default 'Other',
  assigned_to uuid references profiles(id),
  priority text not null default 'MEDIUM' check (priority in ('LOW','MEDIUM','HIGH','URGENT')),
  status text not null default 'TODO' check (status in ('TODO','IN PROGRESS','REVIEW','BLOCKED','DONE')),
  due_date date,
  related_content_id uuid references content(id),
  related_campaign_id uuid references campaigns(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_tasks_client on tasks(client_id);
create index idx_tasks_status on tasks(status);
create index idx_tasks_due on tasks(due_date);

-- ---------------------------------------------------------------------------
-- SEO / Ads
-- ---------------------------------------------------------------------------
create table seo_keywords (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  keyword text not null,
  search_volume int,
  url text,
  search_intent text,
  location text,
  target_rank int,
  notes text,
  created_at timestamptz not null default now()
);

create table seo_rankings (
  id uuid primary key default gen_random_uuid(),
  keyword_id uuid not null references seo_keywords(id) on delete cascade,
  rank int not null,
  checked_at timestamptz not null default now()
);

create table ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null,
  platform text not null,
  objective text,
  budget numeric(12,2),
  start_date date,
  end_date date,
  status text default 'PLANNED' check (status in ('PLANNED','ACTIVE','PAUSED','COMPLETED')),
  created_at timestamptz not null default now()
);

create table ad_metrics (
  id uuid primary key default gen_random_uuid(),
  ad_campaign_id uuid not null references ad_campaigns(id) on delete cascade,
  date date not null,
  spend numeric(12,2) default 0,
  impressions bigint default 0,
  reach bigint default 0,
  clicks bigint default 0,
  leads int default 0,
  conversions int default 0
);

-- ---------------------------------------------------------------------------
-- Reports / Files / Notifications / Integrations
-- ---------------------------------------------------------------------------
create table reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  period text not null,
  prepared_by uuid references profiles(id),
  status text default 'In Progress',
  generated_at timestamptz default now()
);

create table report_sections (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  section_name text not null,
  content jsonb
);

create table files (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  folder text not null default 'Other',
  file_name text not null,
  storage_path text not null,   -- Supabase Storage object path
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Per-client integration configuration (spec section 58) — never assumes every
-- client has the same integrations.
create table client_integrations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  integration text not null,   -- 'meta_ads' | 'google_analytics' | 'search_console' | 'gbp' | 'slack' | etc.
  is_connected boolean not null default false,
  config jsonb default '{}',
  connected_at timestamptz
);

create trigger set_updated_at before update on clients for each row execute procedure moddatetime(updated_at);
create trigger set_updated_at before update on content for each row execute procedure moddatetime(updated_at);
create trigger set_updated_at before update on tasks for each row execute procedure moddatetime(updated_at);
