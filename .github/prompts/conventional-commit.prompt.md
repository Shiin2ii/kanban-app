---
description: "Generate a Conventional Commit message for staged changes. Use when you need a properly formatted commit following feat/fix/chore/refactor/docs convention with optional scope."
argument-hint: "describe what you changed, e.g. 'added drag and drop for task cards'"
agent: "agent"
---

Generate a Conventional Commit message for the following change:

**Change description**: $input

## Rules

Format: `<type>(<scope>): <subject>`

| Type | When to use |
|------|------------|
| `feat` | New feature or user-visible functionality |
| `fix` | Bug fix |
| `chore` | Setup, config, tooling, dependencies |
| `refactor` | Code change that is neither a fix nor a feature |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `perf` | Performance improvement |

**Scope** (optional, use the feature area):
- `auth` — authentication, login, register
- `boards` — board CRUD, board list
- `columns` — column CRUD, ordering
- `tasks` — task CRUD, drag-drop, details
- `storage` — file upload, attachments
- `realtime` — Supabase Realtime subscriptions
- `docker` — Dockerfile, docker-compose
- `db` — Supabase schema, RLS, migrations
- `ui` — shadcn/ui components, styling

## Rules for subject

- Lowercase, no period at end
- Imperative mood: "add" not "added", "fix" not "fixed"
- Max 72 characters
- Describe WHAT, not HOW

## Output

Provide:
1. The commit message on one line (copy-ready)
2. A one-sentence explanation of why this type/scope was chosen
