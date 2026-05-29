# Kanban Task Manager — Project Guidelines

## Project Overview
Full-stack Kanban Board app built with Next.JS 15 App Router, Supabase, TypeScript, and shadcn/ui.
Deadline: 29/05/2026 — Demo & Oral defense: 30/05/2026.

## Stack
- **Frontend**: Next.JS 15 (App Router only — never Pages Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth + PostgreSQL + Realtime + Storage)
- **Containerization**: Docker multi-stage build + Docker Compose
- **Deployment**: VPS + Nginx + Cloudflare SSL

## Architecture
```
app/
  (auth)/            ← login, register pages (public)
  (dashboard)/       ← protected routes (requires auth)
    boards/
      [boardId]/     ← kanban board view
components/
  ui/                ← shadcn/ui primitives
  boards/            ← board-specific components
  tasks/             ← task card components
lib/
  supabase/
    client.ts        ← browser client (createBrowserClient)
    server.ts        ← server client (createServerClient)
  actions/           ← all Server Actions go here
types/
  database.types.ts  ← auto-generated from Supabase
  index.ts           ← custom app types
```

## Code Conventions

### Next.JS
- Default to **Server Components**; add `"use client"` only when needed (interactivity, hooks, browser APIs)
- Use **Server Actions** in `lib/actions/` for all mutations (no API routes unless necessary)
- Data fetching in Server Components, never `useEffect` for initial data
- File naming: `kebab-case` for files, `PascalCase` for components

### TypeScript
- Strict mode enabled — no `any`, use `unknown` + type guards if needed
- Always type function parameters and return values explicitly
- Use `database.types.ts` (Supabase generated) for DB row types
- Use `type` for object shapes, `interface` only when extending

### Supabase
- Use `createServerClient` from `lib/supabase/server.ts` in Server Components and Server Actions
- Use `createBrowserClient` from `lib/supabase/client.ts` in Client Components only
- Every table must have RLS enabled — never disable RLS
- Always handle Supabase errors: check `{ data, error }` pattern

### Styling
- Tailwind utility classes only — no inline styles, no CSS modules
- Use shadcn/ui components as base, extend with Tailwind
- Responsive first: mobile → tablet → desktop (`sm:` `md:` `lg:`)

## Build & Test
```bash
pnpm install          # install dependencies
pnpm dev              # development server
pnpm build            # production build
docker compose up     # run via Docker
```

## Git Conventions
Follow Conventional Commits strictly:
- `feat:` new feature
- `fix:` bug fix
- `chore:` setup, config, tooling
- `refactor:` code change without feature/fix
- `docs:` documentation

Example: `feat(boards): add drag and drop between columns`
