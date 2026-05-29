---
description: "Use when creating or editing Next.JS pages, layouts, components, Server Actions, data fetching, routing, or middleware. Covers App Router patterns, Server vs Client Components, and Server Actions."
applyTo: "app/**,components/**"
---

# Next.JS 15 App Router Patterns

## Server vs Client Components

- **Default to Server Components** — no `"use client"` unless required
- Add `"use client"` only when using: `useState`, `useEffect`, browser APIs, event handlers, `useContext`, dnd-kit
- Server Components can import Client Components — not the reverse
- Never fetch data in Client Components with `useEffect` for initial load

```tsx
// Server Component (default) — no directive needed
export default async function BoardPage({ params }: { params: { boardId: string } }) {
  const supabase = await createServerClient()
  const { data: board } = await supabase.from('boards').select('*').eq('id', params.boardId).single()
  return <BoardView board={board} />
}

// Client Component — only when interactive
"use client"
export function TaskCard({ task }: { task: Task }) {
  const [open, setOpen] = useState(false)
  ...
}
```

## Server Actions

- All mutations live in `lib/actions/` — never inline in components
- Always mark with `"use server"` directive
- Return `{ data, error }` pattern — never throw
- Revalidate affected paths after mutation with `revalidatePath`

```ts
// lib/actions/tasks.ts
"use server"
import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"

export async function createTask(formData: FormData): Promise<{ data: Task | null; error: string | null }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('tasks').insert({...}).select().single()
  if (error) return { data: null, error: error.message }
  revalidatePath(`/boards/${boardId}`)
  return { data, error: null }
}
```

## Routing & Layouts

- Route groups `(auth)`, `(dashboard)` — purely organizational, no URL segment
- Dynamic segments: `[boardId]` — accessed via `params` prop
- Layouts share UI across nested routes — use for nav, sidebar
- Loading states via `loading.tsx` at route level
- Error boundaries via `error.tsx` (must be Client Component)

## Middleware (Auth Protection)

- `middleware.ts` at root — protects `(dashboard)` routes
- Check session, redirect to `/login` if unauthenticated
- Always update session cookies in middleware

## Data Fetching

- Fetch in Server Components directly — no SWR/React Query for initial data
- Use `cache: 'no-store'` for frequently updated data (realtime boards)
- Parallel fetching with `Promise.all` when independent queries

## File Structure

```
app/
  (auth)/
    login/page.tsx
    register/page.tsx
  (dashboard)/
    layout.tsx           ← protected layout with nav
    boards/
      page.tsx           ← list all boards (Server Component)
      [boardId]/
        page.tsx         ← kanban view (Server Component)
        loading.tsx
middleware.ts
```
