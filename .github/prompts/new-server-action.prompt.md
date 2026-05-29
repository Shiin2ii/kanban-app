---
description: "Generate a new Server Action for a Supabase table operation (create, update, delete). Includes error handling, revalidatePath, and typed return value."
argument-hint: "table name and operation, e.g. 'create task in tasks table'"
agent: "agent"
---

Create a Next.JS 15 Server Action in `lib/actions/` for the following operation:

**Operation**: $input

## Requirements

1. Place in the correct file under `lib/actions/` (group by entity, e.g. `lib/actions/tasks.ts`)
2. Mark file with `"use server"` directive at the top
3. Use `createServerClient` from `@/lib/supabase/server` — never browser client
4. Get the authenticated user with `supabase.auth.getUser()` and return early if not authenticated
5. Use `Database` types from `@/types/database.types` for all Supabase row types
6. Return `{ data: T | null; error: string | null }` — never throw
7. Call `revalidatePath(...)` after successful mutation with the correct route path
8. Validate all inputs before sending to Supabase

## Template

```ts
"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database.types"

type <Entity> = Database['public']['Tables']['<table>']['Row']

export async function <actionName>(...args): Promise<{ data: <Entity> | null; error: string | null }> {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Unauthorized" }

  const { data, error } = await supabase
    .from('<table>')
    .<operation>(...)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/boards')
  return { data, error: null }
}
```

After creating the action, show me how to call it from a Client Component using the `useTransition` hook.
