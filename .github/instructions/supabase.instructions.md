---
description: "Use when working with Supabase: writing queries, creating tables, setting up RLS policies, configuring Auth, using Realtime subscriptions, or uploading files to Storage. Covers server vs browser client usage."
applyTo: "lib/supabase/**,lib/actions/**,types/database.types.ts"
---

# Supabase Patterns

## Client Selection Rules

| Context | Client to Use | Import From |
|---------|--------------|-------------|
| Server Component | `createServerClient` | `@/lib/supabase/server` |
| Server Action | `createServerClient` | `@/lib/supabase/server` |
| Route Handler | `createServerClient` | `@/lib/supabase/server` |
| Middleware | `createServerClient` | `@/lib/supabase/server` |
| Client Component | `createBrowserClient` | `@/lib/supabase/client` |

**Never** use `createBrowserClient` on the server — cookies won't be handled correctly.

## Client Setup

```ts
// lib/supabase/server.ts
import { createServerClient as _createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database.types"

export async function createServerClient() {
  const cookieStore = await cookies()
  return _createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
}

// lib/supabase/client.ts
import { createBrowserClient as _createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database.types"

export function createBrowserClient() {
  return _createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

## Error Handling Pattern

Always destructure `{ data, error }` — never assume success:

```ts
const { data, error } = await supabase.from('tasks').select('*')
if (error) {
  console.error('Supabase error:', error.message)
  return { data: null, error: error.message }
}
```

## RLS (Row Level Security)

- **Every table must have RLS enabled** — non-negotiable
- Always create policies for SELECT, INSERT, UPDATE, DELETE
- Standard pattern: `auth.uid() = user_id`

```sql
-- Enable RLS
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

-- SELECT: user sees only their boards
CREATE POLICY "Users can view own boards"
  ON boards FOR SELECT USING (auth.uid() = user_id);

-- INSERT: authenticated users can create boards for themselves
CREATE POLICY "Users can create boards"
  ON boards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE/DELETE: only owner
CREATE POLICY "Users can update own boards"
  ON boards FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own boards"
  ON boards FOR DELETE USING (auth.uid() = user_id);
```

## Realtime Subscriptions

Use in Client Components only. Always unsubscribe on cleanup:

```ts
"use client"
useEffect(() => {
  const supabase = createBrowserClient()
  const channel = supabase
    .channel('tasks-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'tasks',
      filter: `column_id=eq.${columnId}`
    }, (payload) => {
      // handle change
    })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [columnId])
```

## Storage (File Upload)

```ts
// Upload file to Supabase Storage
const { data, error } = await supabase.storage
  .from('task-attachments')
  .upload(`${userId}/${taskId}/${file.name}`, file, { upsert: true })

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('task-attachments')
  .getPublicUrl(data.path)
```

## Auth Helpers

```ts
// Get current user in Server Component/Action
const supabase = await createServerClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

## Database Schema — This Project

```sql
profiles (id uuid PK → auth.users, username text, avatar_url text, updated_at timestamptz)
boards   (id uuid PK, user_id uuid FK → profiles, title text, created_at timestamptz)
columns  (id uuid PK, board_id uuid FK → boards, title text, position int, created_at timestamptz)
tasks    (id uuid PK, column_id uuid FK → columns, title text, description text, position int, created_at timestamptz)
task_attachments (id uuid PK, task_id uuid FK → tasks, file_url text, file_name text, created_at timestamptz)
```
