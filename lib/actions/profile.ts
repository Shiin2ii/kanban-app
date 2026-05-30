"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import type { ActionResult } from "@/types"

export async function updateUsername(username: string): Promise<ActionResult<null>> {
  const trimmed = username.trim()
  if (!trimmed) return { data: null, error: "Tên hiển thị không được để trống" }
  if (trimmed.length < 2) return { data: null, error: "Tên hiển thị phải có ít nhất 2 ký tự" }
  if (trimmed.length > 50) return { data: null, error: "Tên hiển thị không được quá 50 ký tự" }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Chưa đăng nhập" }

  const [{ error: profileError }, { error: authError }] = await Promise.all([
    supabase.from("profiles").update({ username: trimmed, updated_at: new Date().toISOString() }).eq("id", user.id),
    supabase.auth.updateUser({ data: { username: trimmed } }),
  ])

  if (profileError) return { data: null, error: profileError.message }
  if (authError) return { data: null, error: authError.message }

  revalidatePath("/", "layout")
  return { data: null, error: null }
}

export async function updatePassword(currentPassword: string, newPassword: string): Promise<ActionResult<null>> {
  if (!currentPassword) return { data: null, error: "Vui lòng nhập mật khẩu hiện tại" }
  if (newPassword.length < 6) return { data: null, error: "Mật khẩu mới phải có ít nhất 6 ký tự" }
  if (currentPassword === newPassword) return { data: null, error: "Mật khẩu mới phải khác mật khẩu hiện tại" }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return { data: null, error: "Chưa đăng nhập" }

  // Xác thực mật khẩu cũ
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (verifyError) return { data: null, error: "Mật khẩu hiện tại không đúng" }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { data: null, error: error.message }

  return { data: null, error: null }
}

export async function updateAvatarUrl(url: string): Promise<ActionResult<null>> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Chưa đăng nhập" }

  const { error } = await supabase
    .from("profiles")
    .upsert(
      { id: user.id, avatar_url: url, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    )

  if (error) return { data: null, error: error.message }

  revalidatePath("/", "layout")
  return { data: null, error: null }
}

export async function removeAvatar(): Promise<ActionResult<null>> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Chưa đăng nhập" }

  // Xóa file trên storage
  const { error: storageError } = await supabase.storage
    .from("avatars")
    .remove([`${user.id}/avatar`])

  // Dù storage lỗi vẫn xóa URL trong DB
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq("id", user.id)

  if (error) return { data: null, error: error.message }
  if (storageError) console.warn("Storage remove error:", storageError.message)

  revalidatePath("/", "layout")
  return { data: null, error: null }
}
