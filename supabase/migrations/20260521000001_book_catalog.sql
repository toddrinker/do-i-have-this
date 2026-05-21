create table public.book_catalog (
  isbn text primary key,
  title text not null,
  author text not null,
  cover_url text,
  published_year integer,
  open_library_key text,
  description text,
  source text not null default 'open_library', -- 'open_library' | 'claude'
  created_at timestamptz not null default now()
);

-- No RLS needed — this is a shared read/write catalog, not user data.
-- Any authenticated user can read and contribute entries.
alter table public.book_catalog enable row level security;

create policy "Anyone can read catalog"
  on public.book_catalog for select
  using (true);

create policy "Authenticated users can insert catalog entries"
  on public.book_catalog for insert
  to authenticated
  with check (true);

create index book_catalog_title_idx on public.book_catalog
  using gin (to_tsvector('english', title || ' ' || author));
