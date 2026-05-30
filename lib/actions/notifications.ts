"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import type { ActionResult, Notification } from "@/types"

export async function getNotifications(limit = 30): Promise<Notification[]> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  return data ?? []
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  return count ?? 0
}

export async function markAsRead(notifId: string): Promise<ActionResult<null>> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Chưa đăng nhập" }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notifId)
    .eq("user_id", user.id)

  if (error) return { data: null, error: error.message }
  revalidatePath("/")
  return { data: null, error: null }
}

export async function markAllAsRead(): Promise<ActionResult<null>> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Chưa đăng nhập" }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  if (error) return { data: null, error: error.message }
  revalidatePath("/")
  return { data: null, error: null }
}

export async function deleteNotification(notifId: string): Promise<ActionResult<null>> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Chưa đăng nhập" }

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notifId)
    .eq("user_id", user.id)

  if (error) return { data: null, error: error.message }
  revalidatePath("/")
  return { data: null, error: null }
}

export async function clearAllNotifications(): Promise<ActionResult<null>> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Chưa đăng nhập" }

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", user.id)

  if (error) return { data: null, error: error.message }
  revalidatePath("/")
  return { data: null, error: null }
}

/** Tạo thông báo cho task quá hạn và đến hạn hôm nay. Gọi khi load trang /boards. */
export async function generateDueDateNotifications(): Promise<void> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const today = new Date().toISOString().split("T")[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

  // Lấy tasks còn active có due_date
  type TaskRow = { id: string; title: string; due_date: string; columns: { boards: { id: string } | null } | null }
  const { data: rawTasks } = await supabase
    .from("tasks")
    .select("id, title, due_date, columns!inner(boards!inner(id))")
    .eq("is_completed", false)
    .not("due_date", "is", null)
    .lte("due_date", today)

  const tasks = rawTasks as unknown as TaskRow[] | null
  if (!tasks || tasks.length === 0) return

  const inserts: {
    user_id: string
    type: string
    title: string
    body: string
    link: string
    ref_id: string
    is_read: boolean
  }[] = []

  for (const task of tasks) {
    const boardId = task.columns?.boards?.id
    if (!boardId) continue

    if (task.due_date < today) {
      // Quá hạn - chỉ tạo nếu chưa có (unique constraint sẽ bắt)
      inserts.push({
        user_id: user.id,
        type: "task_overdue",
        title: "Task quá hạn",
        body: `"${task.title}" đã quá hạn từ ${task.due_date}`,
        link: `/boards/${boardId}`,
        ref_id: `overdue_${task.id}`,
        is_read: false,
      })
    } else if (task.due_date === today) {
      inserts.push({
        user_id: user.id,
        type: "task_due_today",
        title: "Task đến hạn hôm nay",
        body: `"${task.title}" cần hoàn thành trước cuối ngày`,
        link: `/boards/${boardId}`,
        ref_id: `today_${task.id}`,
        is_read: false,
      })
    }
  }

  if (inserts.length > 0) {
    // onConflict: bỏ qua nếu đã tồn tại (unique index trên user_id, type, ref_id)
    await supabase
      .from("notifications")
      .upsert(inserts, { onConflict: "user_id,type,ref_id", ignoreDuplicates: true })
  }

  // Xóa notifications quá hạn của tasks đã hoàn thành
  // (không cần thiết nhưng giúp cleanup)
  await supabase
    .from("notifications")
    .delete()
    .eq("user_id", user.id)
    .in("type", ["task_overdue", "task_due_today"])
    .lt("created_at", yesterday)
    .eq("is_read", true)
}

/** Tạo thông báo khi hoàn thành task (gọi từ toggleTaskComplete). */
export async function createTaskCompletedNotification(
  taskId: string,
  taskTitle: string,
  boardId: string
): Promise<void> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from("notifications").upsert(
    {
      user_id: user.id,
      type: "task_completed",
      title: "Task hoàn thành",
      body: `"${taskTitle}" đã được đánh dấu hoàn thành`,
      link: `/boards/${boardId}`,
      ref_id: `done_${taskId}`,
      is_read: false,
    },
    { onConflict: "user_id,type,ref_id", ignoreDuplicates: false }
  )
}

/** Tạo thông báo khi tạo board mới. */
export async function createBoardCreatedNotification(
  boardId: string,
  boardTitle: string
): Promise<void> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "board_created",
    title: "Board mới đã được tạo",
    body: `Board "${boardTitle}" sẵn sàng để sử dụng`,
    link: `/boards/${boardId}`,
    ref_id: null,
    is_read: false,
  })
}
