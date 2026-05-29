"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import type { ActionResult, Task } from "@/types"

export async function createTask(
  boardId: string,
  columnId: string,
  title: string,
  description?: string
): Promise<ActionResult<Task>> {
  const trimmed = title.trim()
  if (!trimmed) return { data: null, error: "Tên task không được để trống" }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Chưa đăng nhập" }

  const { data: existing } = await supabase
    .from("tasks")
    .select("id")
    .eq("column_id", columnId)

  const position = existing?.length ?? 0

  const { data, error } = await supabase
    .from("tasks")
    .insert({ column_id: columnId, title: trimmed, description: description?.trim() || null, position })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath(`/boards/${boardId}`)
  return { data, error: null }
}

export async function deleteTask(
  boardId: string,
  taskId: string
): Promise<ActionResult<null>> {
  const supabase = await createServerClient()
  const { error } = await supabase.from("tasks").delete().eq("id", taskId)
  if (error) return { data: null, error: error.message }

  revalidatePath(`/boards/${boardId}`)
  return { data: null, error: null }
}

export async function moveTask(
  boardId: string,
  taskId: string,
  newColumnId: string,
  newPosition: number
): Promise<ActionResult<null>> {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from("tasks")
    .update({ column_id: newColumnId, position: newPosition })
    .eq("id", taskId)

  if (error) return { data: null, error: error.message }

  revalidatePath(`/boards/${boardId}`)
  return { data: null, error: null }
}

export async function updateTask(
  boardId: string,
  taskId: string,
  title: string,
  description?: string
): Promise<ActionResult<Task>> {
  const trimmed = title.trim()
  if (!trimmed) return { data: null, error: "Tên task không được để trống" }

  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("tasks")
    .update({ title: trimmed, description: description?.trim() || null })
    .eq("id", taskId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath(`/boards/${boardId}`)
  return { data, error: null }
}
