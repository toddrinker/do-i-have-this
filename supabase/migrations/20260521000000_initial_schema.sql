create extension if not exists "uuid-ossp";

create table public.books (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  author text not null,
  isbn text,
  cover_url text,
  notes text,
  added_at timestamptz not null default now(),
  open_library_key text,
  description text,
  published_year integer
);

alter table public.books enable row level security;

create policy "Users can read their own books"
  on public.books for select
  using (auth.uid() = user_id);

create policy "Users can insert their own books"
  on public.books for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own books"
  on public.books for update
  using (auth.uid() = user_id);

create policy "Users can delete their own books"
  on public.books for delete
  using (auth.uid() = user_id);

create index books_user_id_idx on public.books (user_id);
create index books_title_idx on public.books using gin (to_tsvector('english', title));
