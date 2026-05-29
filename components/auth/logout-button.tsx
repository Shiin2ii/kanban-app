"use client"

import { Button } from "@/components/ui/button"
import { logout } from "@/lib/actions/auth"

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button variant="ghost" size="sm" type="submit">
        Đăng xuất
      </Button>
    </form>
  )
}
