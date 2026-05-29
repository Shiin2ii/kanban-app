"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import type { ActionResult } from "@/types"

export async function login(
  _prevState: ActionResult<null>,
  formData: FormData
): Promise<ActionResult<null>> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { data: null, error: "Email và mật khẩu không được để trống" }
  }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { data: null, error: "Email hoặc mật khẩu không đúng" }
  }

  revalidatePath("/", "layout")
  redirect("/boards")
}

export async function register(
  _prevState: ActionResult<null>,
  formData: FormData
): Promise<ActionResult<null>> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const username = formData.get("username") as string

  if (!email || !password || !username) {
    return { data: null, error: "Vui lòng điền đầy đủ thông tin" }
  }

  if (password.length < 6) {
    return { data: null, error: "Mật khẩu phải có ít nhất 6 ký tự" }
  }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  })

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath("/", "layout")
  redirect("/boards")
}

export async function logout(): Promise<void> {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/login")
}
