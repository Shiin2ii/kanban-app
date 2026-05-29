---
description: "Use when writing TypeScript code, defining types, interfaces, or working with Supabase-generated database types. Covers strict mode conventions, type patterns, and common anti-patterns."
applyTo: "**/*.ts,**/*.tsx"
---

# TypeScript Conventions

## Strict Rules

- **No `any`** — use `unknown` + type guard, or a proper type
- **No `!` non-null assertion** unless you are 100% certain (prefer early return)
- Always type function parameters and return values explicitly
- Enable strict mode in `tsconfig.json` (already set)

## Type vs Interface

```ts
// Use `type` for object shapes, unions, intersections
type Task = {
  id: string
  title: string
  column_id: string
  position: number
  created_at: string
}

type TaskStatus = 'todo' | 'in-progress' | 'done'

// Use `interface` only when extending
interface ExtendedTask extends Task {
  attachments: TaskAttachment[]
}
```

## Database Types

Always use auto-generated types from `types/database.types.ts`:

```ts
import type { Database } from "@/types/database.types"

// Row type from DB
type Board = Database['public']['Tables']['boards']['Row']
type BoardInsert = Database['public']['Tables']['boards']['Insert']
type BoardUpdate = Database['public']['Tables']['boards']['Update']
```

## Server Action Return Pattern

```ts
// Consistent return type for all Server Actions
type ActionResult<T> = {
  data: T | null
  error: string | null
}

export async function createBoard(title: string): Promise<ActionResult<Board>> {
  // ...
  return { data: null, error: error.message }
}
```

## Component Props

```ts
// Always define explicit prop types
type TaskCardProps = {
  task: Task
  onUpdate?: (task: Task) => void
  className?: string
}

export function TaskCard({ task, onUpdate, className }: TaskCardProps) { ... }
```

## Type Guards

```ts
// Use type guards instead of `any` when type is unknown
function isTask(value: unknown): value is Task {
  return typeof value === 'object' && value !== null && 'id' in value && 'title' in value
}
```

## Avoid

```ts
// BAD
const data: any = await fetch(...)
const user = session!.user
function doSomething(x) { ... }

// GOOD
const data: unknown = await fetch(...)
if (!session?.user) return null
function doSomething(x: string): void { ... }
```
