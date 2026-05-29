"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login, register } from "@/lib/actions/auth"
import type { ActionResult } from "@/types"

type AuthFormProps = {
  mode: "login" | "register"
}

const initialState: ActionResult<null> = { data: null, error: null }

export function AuthForm({ mode }: AuthFormProps) {
  const action = mode === "login" ? login : register
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="space-y-4">
      {mode === "register" && (
        <div className="space-y-2">
          <Label htmlFor="username">Tên hiển thị</Label>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="Nguyễn Văn A"
            required
            disabled={pending}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="email@example.com"
          required
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={mode === "register" ? "Ít nhất 6 ký tự" : "••••••••"}
          required
          disabled={pending}
        />
      </div>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending
          ? mode === "login" ? "Đang đăng nhập..." : "Đang tạo tài khoản..."
          : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"
        }
      </Button>
    </form>
  )
}
