-- Personal recipe imports. Private to their owner: never readable by anyone else and never
-- joined into the public recipes catalogue or home segments.

create table imported_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  source_url text not null,
  source_name text not null,
  recipe jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, source_url)
);

alter table imported_recipes enable row level security;
create policy "own imports" on imported_recipes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
