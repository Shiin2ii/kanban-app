---
description: "Generate a Supabase SQL migration for a new table: schema definition, RLS enable, and all 4 CRUD policies (SELECT, INSERT, UPDATE, DELETE) scoped to the authenticated user."
argument-hint: "table name and columns, e.g. 'tasks table with title, description, column_id, position'"
agent: "agent"
---

Generate a Supabase SQL migration for the following table:

**Table specification**: $input

## Requirements

1. Use `uuid` primary key with `gen_random_uuid()` default
2. Include `created_at timestamptz NOT NULL DEFAULT now()`
3. Add foreign keys with `ON DELETE CASCADE` where appropriate
4. **Enable RLS** — `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`
5. Create **4 RLS policies**: SELECT, INSERT, UPDATE, DELETE
6. Policies must scope access via `auth.uid()` — either directly on `user_id` column or through a JOIN to the parent table
7. Add `position int` column with default `0` if this is an ordered list table

## Output Format

Produce a single SQL block ready to paste into the Supabase SQL Editor:

```sql
-- Create table
CREATE TABLE <table_name> (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- columns here
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own <table_name>"
  ON <table_name> FOR SELECT USING (...);

CREATE POLICY "Users can create <table_name>"
  ON <table_name> FOR INSERT WITH CHECK (...);

CREATE POLICY "Users can update own <table_name>"
  ON <table_name> FOR UPDATE USING (...);

CREATE POLICY "Users can delete own <table_name>"
  ON <table_name> FOR DELETE USING (...);
```

After the SQL, also provide the TypeScript type that matches this table (using `type`, not `interface`), and show me which file to add it to in the project.
