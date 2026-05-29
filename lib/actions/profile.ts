"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import type { ActionResult } from "@/types"

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
