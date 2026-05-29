"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import type { ActionResult, Column, BoardWithColumns } from "@/types"

export async function getBoardWithColumns(boardId: string): Promise<BoardWithColumns | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("boards")
    .select(`
      *,
      columns (
        *,
        tasks ( * )
      )
    `)
    .eq("id", boardId)
    .eq("user_id", user.id)
    .order("position", { referencedTable: "columns" })
    .single()

  if (!data) return null

  const board = data as unknown as BoardWithColumns

  return {
    ...board,
    columns: (board.columns ?? [])
      .sort((a, b) => a.position - b.position)
      .map((col) => ({
        ...col,
        tasks: (col.tasks ?? []).sort((a, b) => a.position - b.position),
      })),
  }
}

export async function createColumn(
  boardId: string,
  title: string
): Promise<ActionResult<Column>> {
  const trimmed = title.trim()
  if (!trimmed) return { data: null, error: "Tên cột không được để trống" }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Chưa đăng nhập" }

  const { data: existing } = await supabase
    .from("columns")
    .select("id")
    .eq("board_id", boardId)

  const position = existing?.length ?? 0

  const { data, error } = await supabase
    .from("columns")
    .insert({ board_id: boardId, title: trimmed, position })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath(`/boards/${boardId}`)
  return { data, error: null }
}

export async function deleteColumn(
  boardId: string,
  columnId: string
): Promise<ActionResult<null>> {
  const supabase = await createServerClient()
  const { error } = await supabase.from("columns").delete().eq("id", columnId)
  if (error) return { data: null, error: error.message }

  revalidatePath(`/boards/${boardId}`)
  return { data: null, error: null }
}

export async function updateColumnTitle(
  boardId: string,
  columnId: string,
  title: string
): Promise<ActionResult<null>> {
  const trimmed = title.trim()
  if (!trimmed) return { data: null, error: "Tên cột không được để trống" }

  const supabase = await createServerClient()
  const { error } = await supabase
    .from("columns")
    .update({ title: trimmed })
    .eq("id", columnId)

  if (error) return { data: null, error: error.message }

  revalidatePath(`/boards/${boardId}`)
  return { data: null, error: null }
}
