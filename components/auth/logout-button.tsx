"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logout } from "@/lib/actions/auth"

export function LogoutButton({ asMenuItem = false }: { asMenuItem?: boolean }) {
  if (asMenuItem) {
    return (
      <form action={logout} className="w-full">
        <button type="submit" className="flex w-full items-center gap-2 text-sm text-destructive">
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </button>
      </form>
    )
  }

  return (
    <form action={logout}>
      <Button variant="ghost" size="sm" type="submit">
        Đăng xuất
      </Button>
    </form>
  )
}
