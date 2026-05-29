"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import type { ActionResult, Board } from "@/types"

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
