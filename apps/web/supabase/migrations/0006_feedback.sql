-- In-app feedback: a 1–5 rating and an optional note, asked after the third finished meal.
-- Written by the server (service role) only; nobody can read it from the browser.

create table if not exists feedback (
  id bigserial primary key,
  user_id uuid references auth.users on delete set null,
  rating smallint not null check (rating between 1 and 5),
  message text check (char_length(message) <= 1000),
  meals_finished int,
  created_at timestamptz not null default now()
);
create index if not exists feedback_created on feedback (created_at desc);

alter table feedback enable row level security;
