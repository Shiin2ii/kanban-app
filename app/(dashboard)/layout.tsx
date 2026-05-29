import type { ReactNode } from "react"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* TODO: Phase 3 — NavBar component */}
      <header className="h-14 border-b flex items-center px-6">
        <span className="font-semibold text-lg">Kanban Board</span>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
