-- Giveaway entries, orders from Whop checkout, and the Apprentice Meets Master community.
-- All written by the server with the service role; RLS is on with no public policies.

create table if not exists giveaway_entries (
  user_id text primary key,
  name text not null,
  email text not null,
  code text not null unique,
  referred_by text,
  created_at timestamptz not null default now()
);
create index if not exists giveaway_referred_by on giveaway_entries (referred_by);

create table if not exists orders (
  order_id text primary key,
  golden_user_id text not null,
  offer text not null,
  status text not null default 'pending',
  whop_payment_id text,
  referred_by text,
  updated_at timestamptz not null default now()
);

create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  level text not null check (level in ('beginner', 'intermediate', 'chef')),
  dish text not null check (char_length(dish) between 2 and 80),
  note text not null check (char_length(note) between 2 and 500),
  asks_for_help boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists community_posts_created on community_posts (created_at desc);

create table if not exists community_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts on delete cascade,
  user_id text not null,
  name text not null,
  level text not null check (level in ('beginner', 'intermediate', 'chef')),
  body text not null check (char_length(body) between 2 and 500),
  created_at timestamptz not null default now()
);
create index if not exists community_replies_post on community_replies (post_id, created_at);

alter table giveaway_entries enable row level security;
alter table orders enable row level security;
alter table community_posts enable row level security;
alter table community_replies enable row level security;
