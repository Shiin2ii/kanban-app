"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import { createBoardCreatedNotification } from "@/lib/actions/notifications"
import { BOARD_TEMPLATES } from "@/lib/templates"
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

  type RawBoard = {
    id: string
    title: string
    created_at: string
    user_id: string
    columns: { tasks: { id: string; is_completed: boolean | null; due_date: string | null }[] }[]
  }

  return (data as RawBoard[]).map((b) => {
    const { columns, ...boardData } = b
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

  // Thông báo board mới
  await createBoardCreatedNotification(data.id, data.title)

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

export async function duplicateBoard(boardId: string): Promise<ActionResult<Board>> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Chưa đăng nhập" }

  // Lấy board gốc kèm columns và tasks
  const { data: source, error: fetchError } = await supabase
    .from("boards")
    .select(`*, columns(*, tasks(*))`)
    .eq("id", boardId)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !source) return { data: null, error: "Không tìm thấy board" }

  type SourceCol = { id: string; title: string; position: number; tasks: { title: string; description: string | null; priority: string | null; due_date: string | null; position: number }[] }
  const board = source as unknown as { title: string; columns: SourceCol[] }

  // Tạo board mới
  const { data: newBoard, error: boardError } = await supabase
    .from("boards")
    .insert({ title: `${board.title} (Copy)`, user_id: user.id })
    .select()
    .single()

  if (boardError || !newBoard) return { data: null, error: boardError?.message ?? "Lỗi tạo board" }

  // Copy từng column + tasks
  for (const col of board.columns) {
    const { data: newCol, error: colError } = await supabase
      .from("columns")
      .insert({ board_id: newBoard.id, title: col.title, position: col.position })
      .select()
      .single()

    if (colError || !newCol) continue

    if (col.tasks.length > 0) {
      await supabase.from("tasks").insert(
        col.tasks.map((t) => ({
          column_id: newCol.id,
          title: t.title,
          description: t.description,
          priority: t.priority,
          due_date: t.due_date,
          is_completed: false,
          position: t.position,
        }))
      )
    }
  }

  revalidatePath("/boards")
  return { data: newBoard as Board, error: null }
}

export async function createBoardFromTemplate(
  templateId: string,
  customTitle?: string
): Promise<ActionResult<Board>> {
  const template = BOARD_TEMPLATES.find((t) => t.id === templateId)
  if (!template) return { data: null, error: "Template không tồn tại" }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Chưa đăng nhập" }

  const title = customTitle?.trim() || template.name

  const { data: board, error: boardError } = await supabase
    .from("boards")
    .insert({ title, user_id: user.id })
    .select()
    .single()

  if (boardError || !board) return { data: null, error: boardError?.message ?? "Lỗi tạo board" }

  for (let i = 0; i < template.columns.length; i++) {
    const col = template.columns[i]
    const { data: newCol, error: colError } = await supabase
      .from("columns")
      .insert({ board_id: board.id, title: col.title, position: i })
      .select()
      .single()

    if (colError || !newCol) continue

    if (col.tasks.length > 0) {
      await supabase.from("tasks").insert(
        col.tasks.map((t, pos) => ({
          column_id: newCol.id,
          title: t.title,
          priority: t.priority,
          position: pos,
          is_completed: false,
        }))
      )
    }
  }

  await createBoardCreatedNotification(board.id, board.title)

  // Lưu màu board vào metadata (client sẽ tự đọc từ localStorage, không cần lưu DB)
  revalidatePath("/boards")
  return { data: board as Board, error: null }
}
