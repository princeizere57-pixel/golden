-- TheMealDB library, copied in by the build (scripts/seed-mealdb.mts) so the recipes live in our
-- database too: queryable next to profiles and subscriptions, and a fallback when TheMealDB is
-- down. Public read (it's public recipe data); only the server (service role) writes.
-- Credit TheMealDB wherever these are shown (their terms). Safe to run more than once.
create table if not exists mealdb_meals (
  id text primary key,
  name text not null,
  category text,
  area text,
  instructions text not null,
  thumb text,
  youtube text,
  source text,
  ingredients jsonb not null default '[]'::jsonb,
  date_modified timestamp,
  updated_at timestamptz not null default now()
);
create index if not exists mealdb_meals_category on mealdb_meals (category);
create index if not exists mealdb_meals_area on mealdb_meals (area);
create index if not exists mealdb_meals_date on mealdb_meals (date_modified desc);
alter table mealdb_meals enable row level security;
drop policy if exists "mealdb meals are public" on mealdb_meals;
create policy "mealdb meals are public" on mealdb_meals for select using (true);
