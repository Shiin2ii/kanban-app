import type { ReactNode } from "react"
import { Layers } from "lucide-react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/50 px-4">
      <div className="mb-6 flex items-center gap-2">
        <Layers className="h-7 w-7 text-primary" />
        <span className="text-xl font-bold tracking-tight">KanbanFlow</span>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
