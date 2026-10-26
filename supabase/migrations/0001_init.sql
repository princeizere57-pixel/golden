-- Be a Chef: initial schema with row-level security.

create type skill_level as enum ('beginner', 'intermediate', 'chef');
create type plan as enum ('free', 'premium');
create type billing_entity as enum ('us', 'uk');
create type billing_channel as enum ('web', 'app_store', 'google_play');
create type subscription_status as enum ('trialing', 'active', 'grace', 'past_due', 'paused', 'canceled', 'expired', 'revoked');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  skill skill_level not null default 'beginner',
  billing_country char(2),
  created_at timestamptz not null default now()
);

create table recipes (
  slug text primary key,
  title text not null,
  summary text not null,
  chef text not null,
  category text not null,
  dietary text[] not null default '{}',
  serves int not null check (serves > 0),
  colourway text not null default 'charcoal',
  video_url text,
  image_url text,
  premium boolean not null default false,
  ingredients jsonb not null default '[]',
  published_at timestamptz not null default now()
);

-- OneKit-style atomic blocks, ordered per recipe.
create table recipe_blocks (
  recipe_slug text not null references recipes on delete cascade,
  position int not null,
  id text not null,
  kind text not null check (kind in ('prep', 'heat', 'timing')),
  body jsonb not null,
  primary key (recipe_slug, position),
  unique (recipe_slug, id)
);

-- Data-driven home page (see src/lib/discovery/segments.ts).
create table segments (
  id text primary key,
  position int not null,
  type text not null check (type in ('rail', 'newRecipes', 'continueCooking', 'premiumPromo')),
  heading text not null,
  config jsonb not null default '{}',
  visible_plans plan[],
  visible_skills skill_level[]
);

create table pantry_items (
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  quantity numeric,
  unit text,
  primary key (user_id, name)
);

-- Lets cook-mode timers survive reloads and move between devices.
create table active_timers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  recipe_slug text not null references recipes on delete cascade,
  block_id text not null,
  label text not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table subscriptions (
  provider billing_channel not null,
  external_id text not null,
  user_id uuid references auth.users on delete set null,
  entity billing_entity,
  status subscription_status not null,
  current_period_end timestamptz,
  updated_at timestamptz not null default now(),
  primary key (provider, external_id)
);
create index subscriptions_user on subscriptions (user_id);

-- A user is premium while any subscription is in an entitled state and not past its period.
create view entitlements as
select user_id,
       bool_or(status in ('trialing', 'active', 'grace', 'canceled')
               and (current_period_end is null or current_period_end > now())) as premium
from subscriptions
where user_id is not null
group by user_id;

alter table profiles enable row level security;
alter table recipes enable row level security;
alter table recipe_blocks enable row level security;
alter table segments enable row level security;
alter table pantry_items enable row level security;
alter table active_timers enable row level security;
alter table subscriptions enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "recipes are public" on recipes for select using (true);
create policy "blocks are public" on recipe_blocks for select using (true);
create policy "segments are public" on segments for select using (true);
create policy "own pantry" on pantry_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own timers" on active_timers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Users can read their subscriptions; only the service role (webhooks) writes them.
create policy "read own subscriptions" on subscriptions for select using (auth.uid() = user_id);
