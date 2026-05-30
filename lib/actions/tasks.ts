"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import { createTaskCompletedNotification } from "@/lib/actions/notifications"
import type { ActionResult, Task } from "@/types"

export async function createTask(
  boardId: string,
  columnId: string,
  title: string,
  description?: string,
  priority?: string,
  dueDate?: string
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
    .insert({
      column_id: columnId,
      title: trimmed,
      description: description?.trim() || null,
      priority: priority ?? "medium",
      due_date: dueDate || null,
      position,
    })
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
  description?: string,
  priority?: string,
  dueDate?: string | null
): Promise<ActionResult<Task>> {
  const trimmed = title.trim()
  if (!trimmed) return { data: null, error: "Tên task không được để trống" }

  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: trimmed,
      description: description?.trim() || null,
      priority: priority ?? "medium",
      due_date: dueDate ?? null,
    })
    .eq("id", taskId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath(`/boards/${boardId}`)
  return { data, error: null }
}

export async function toggleTaskComplete(
  boardId: string,
  taskId: string,
  isCompleted: boolean
): Promise<ActionResult<null>> {
  const supabase = await createServerClient()

  // Lấy title để tạo thông báo
  const { data: task } = await supabase
    .from("tasks")
    .select("title")
    .eq("id", taskId)
    .single()

  const { error } = await supabase
    .from("tasks")
    .update({ is_completed: isCompleted })
    .eq("id", taskId)

  if (error) return { data: null, error: error.message }

  if (isCompleted && task?.title) {
    await createTaskCompletedNotification(taskId, task.title, boardId)
  }

  revalidatePath(`/boards/${boardId}`)
  return { data: null, error: null }
}

export async function clearCompletedTasks(
  boardId: string,
  columnId: string
): Promise<ActionResult<null>> {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("column_id", columnId)
    .eq("is_completed", true)

  if (error) return { data: null, error: error.message }

  revalidatePath(`/boards/${boardId}`)
  return { data: null, error: null }
}

export async function duplicateTask(
  boardId: string,
  taskId: string
): Promise<ActionResult<Task>> {
  const supabase = await createServerClient()

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single()

  if (fetchError || !task) return { data: null, error: fetchError?.message ?? "Không tìm thấy task" }

  const { data: siblings } = await supabase
    .from("tasks")
    .select("position")
    .eq("column_id", task.column_id)
    .order("position", { ascending: false })
    .limit(1)

  const position = siblings && siblings.length > 0 ? siblings[0].position + 1 : 0

  const { data, error: insertError } = await supabase
    .from("tasks")
    .insert({
      column_id: task.column_id,
      title: task.title + " (copy)",
      description: task.description,
      priority: task.priority,
      due_date: task.due_date,
      is_completed: false,
      position,
    })
    .select()
    .single()

  if (insertError) return { data: null, error: insertError.message }

  revalidatePath(`/boards/${boardId}`)
  return { data, error: null }
}
