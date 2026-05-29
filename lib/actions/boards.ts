"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import type { ActionResult, Board, BoardStats } from "@/types"

export async function getBoards(): Promise<Board[]> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("boards")
    .select("*")
    .order("created_at", { ascending: false })

  return data ?? []
}

export async function getBoardsWithStats(): Promise<BoardStats[]> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const today = new Date().toISOString().split("T")[0]
  const { data } = await supabase
    .from("boards")
    .select("id, title, created_at, user_id, columns(tasks(id, is_completed, due_date))")
    .order("created_at", { ascending: false })

  if (!data) return []

  return data.map((b) => {
    const { columns, ...boardData } = b as typeof b & { columns: { tasks: { id: string; is_completed: boolean | null; due_date: string | null }[] }[] }
    const tasks = columns.flatMap((c) => c.tasks)
    const taskCount = tasks.length
    const doneCount = tasks.filter((t) => t.is_completed).length
    const overdueCount = tasks.filter((t) => !!(t.due_date && t.due_date < today && !t.is_completed)).length
    return { ...boardData, taskCount, doneCount, overdueCount } as BoardStats
  })
}

export async function createBoard(
  _prevState: ActionResult<Board>,
  formData: FormData
): Promise<ActionResult<Board>> {
  const title = (formData.get("title") as string)?.trim()
  if (!title) return { data: null, error: "Tên board không được để trống" }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Chưa đăng nhập" }

  const { data, error } = await supabase
    .from("boards")
    .insert({ title, user_id: user.id })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath("/boards")
  return { data, error: null }
}

export async function deleteBoard(boardId: string): Promise<ActionResult<null>> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Chưa đăng nhập" }

  const { error } = await supabase
    .from("boards")
    .delete()
    .eq("id", boardId)
    .eq("user_id", user.id)

  if (error) return { data: null, error: error.message }

  revalidatePath("/boards")
  return { data: null, error: null }
}

export async function updateBoard(
  boardId: string,
  title: string
): Promise<ActionResult<Board>> {
  const trimmed = title.trim()
  if (!trimmed) return { data: null, error: "Tên board không được để trống" }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Chưa đăng nhập" }

  const { data, error } = await supabase
    .from("boards")
    .update({ title: trimmed })
    .eq("id", boardId)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath("/boards")
  return { data, error: null }
}
