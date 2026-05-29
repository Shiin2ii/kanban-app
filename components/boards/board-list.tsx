"use client"

import Link from "next/link"
import { useState } from "react"
import { LayoutGrid, MoreHorizontal, Trash2, AlertTriangle } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteBoard } from "@/lib/actions/boards"
import type { BoardStats } from "@/types"

const STRIPE_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-orange-500",
]

function getBoardStripe(id: string): string {
  let hash = 0
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) % STRIPE_COLORS.length
  }
  return STRIPE_COLORS[hash]
}

type BoardListProps = {
  boards: BoardStats[]
}

export function BoardList({ boards }: BoardListProps) {
  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <LayoutGrid className="h-14 w-14 mb-4 text-muted-foreground/30" />
        <p className="text-lg font-medium text-muted-foreground">Chưa có board nào</p>
        <p className="text-sm mt-1 text-muted-foreground/70">
          Nhấn &quot;+ Tạo board&quot; để bắt đầu.
        </p>
      </div>
    )
  }

  const recent = boards.slice(0, 3)
  const hasMore = boards.length > 3

  return (
    <div className="space-y-8">
      {/* Recent boards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Gần đây
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {recent.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
        </div>
      </div>

      {/* All boards */}
      {hasMore && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Tất cả boards
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {boards.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BoardCard({ board }: { board: BoardStats }) {
  const [deleting, setDeleting] = useState(false)
  const stripe = getBoardStripe(board.id)

  async function handleDelete() {
    if (!confirm(`Xóa board "${board.title}"?`)) return
    setDeleting(true)
    await deleteBoard(board.id)
  }

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
        deleting ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {/* Color stripe */}
      <div className={`h-1.5 w-full ${stripe}`} />

      <Link href={`/boards/${board.id}`} className="block">
        <CardHeader className="pb-4">
          <CardTitle className="text-base line-clamp-2 pr-8 leading-snug">
            {board.title}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {new Date(board.created_at).toLocaleDateString("vi-VN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </CardHeader>
      </Link>

      {/* Task progress */}
      {board.taskCount > 0 && (
        <Link href={`/boards/${board.id}`} className="block px-6 pb-4 -mt-1">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.round((board.doneCount / board.taskCount) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1.5">
            <p className="text-xs text-muted-foreground">
              {board.doneCount}/{board.taskCount} hoàn thành
            </p>
            {board.overdueCount > 0 && (
              <p className="flex items-center gap-1 text-xs text-red-500 font-medium">
                <AlertTriangle className="h-3 w-3" />{board.overdueCount} quá hạn
              </p>
            )}
          </div>
        </Link>
      )}

      <div className="absolute top-4 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7" />}>
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive gap-2"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xóa board
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}
