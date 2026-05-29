import type { ReactNode } from "react"
import { NavBar } from "@/components/auth/nav-bar"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
