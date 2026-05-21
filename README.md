# Wait, Do I Have This?

Photograph a book cover or spine — instantly know if it's already in your library.

## Stack

| Layer | Tech |
|---|---|
| Mobile | Expo (React Native) |
| Web | Next.js 15 (App Router) |
| Monorepo | Turborepo |
| Backend | Supabase (Postgres + Auth + Storage) |
| AI Vision | Claude API (Haiku) |
| Book metadata | Open Library API |

## Project structure

```
apps/
  mobile/     Expo app (iOS + Android)
  web/        Next.js app + API routes
packages/
  shared/     TypeScript types, DB schema types
supabase/
  migrations/ SQL migration files
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

- Create a project at [supabase.com](https://supabase.com)
- Run the migration in `supabase/migrations/`
- Copy `.env.local.example` → `.env.local` in `apps/web/`

### 3. Add API keys

`apps/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...
```

`apps/mobile/.env`:
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 4. Run

```bash
# Web (localhost:3000)
npm run dev --workspace=apps/web

# Mobile
npm run dev --workspace=apps/mobile
```

## How it works

1. User photographs a book cover or spine
2. Image is sent to `/api/identify` (Next.js API route)
3. Claude vision model extracts title + author
4. Open Library API enriches with ISBN, cover art, publication year
5. User confirms and adds to their Supabase-backed library
