"use client"

import Link from "next/link"
import { useState, useEffect, useMemo } from "react"
import { LayoutGrid, MoreHorizontal, Trash2, AlertTriangle, Palette, Copy, Loader2, Search, ArrowUpDown } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteBoard, duplicateBoard } from "@/lib/actions/boards"
import type { BoardStats } from "@/types"

const BOARD_COLORS = [
  { id: "blue",   hex: "#3b82f6" },
  { id: "violet", hex: "#8b5cf6" },
  { id: "green",  hex: "#22c55e" },
  { id: "pink",   hex: "#ec4899" },
  { id: "orange", hex: "#f97316" },
  { id: "red",    hex: "#ef4444" },
  { id: "slate",  hex: "#64748b" },
]

const DEFAULT_COLOR = BOARD_COLORS[0]

function getBoardColor(boardId: string): { id: string; hex: string } {
  if (typeof window === "undefined") return DEFAULT_COLOR
  const saved = localStorage.getItem(`board-color-${boardId}`)
  return BOARD_COLORS.find((c) => c.id === saved) ?? DEFAULT_COLOR
}

type SortOption = "newest" | "oldest" | "name_asc" | "name_desc" | "most_tasks" | "overdue"

const SORT_LABELS: Record<SortOption, string> = {
  newest:     "Mới nhất",
  oldest:     "Cũ nhất",
  name_asc:   "Tên A → Z",
  name_desc:  "Tên Z → A",
  most_tasks: "Nhiều task nhất",
  overdue:    "Nhiều quá hạn nhất",
}

type BoardListProps = {
  boards: BoardStats[]
}

export function BoardList({ boards }: BoardListProps) {
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortOption>("newest")

  const filtered = useMemo(() => {
    let list = boards.filter((b) =>
      b.title.toLowerCase().includes(search.toLowerCase().trim())
    )
    switch (sort) {
      case "newest":     list = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at)); break
      case "oldest":     list = [...list].sort((a, b) => a.created_at.localeCompare(b.created_at)); break
      case "name_asc":   list = [...list].sort((a, b) => a.title.localeCompare(b.title, "vi")); break
      case "name_desc":  list = [...list].sort((a, b) => b.title.localeCompare(a.title, "vi")); break
      case "most_tasks": list = [...list].sort((a, b) => b.taskCount - a.taskCount); break
      case "overdue":    list = [...list].sort((a, b) => b.overdueCount - a.overdueCount); break
    }
    return list
  }, [boards, search, sort])

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

  return (
    <div className="space-y-6">
      {/* Search + Sort bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm board..."
            className="pl-8 h-8 text-sm"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 h-8 px-3 text-sm rounded-md border border-input bg-background hover:bg-accent transition-colors outline-none">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">{SORT_LABELS[sort]}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => setSort(key)}
                className={sort === key ? "font-medium text-primary" : ""}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {search && (
          <p className="text-xs text-muted-foreground shrink-0">
            {filtered.length}/{boards.length} kết quả
          </p>
        )}
      </div>

      {/* No results */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p>Không tìm thấy board &quot;{search}&quot;</p>
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
        </div>
      )}
    </div>
  )
}

function BoardCard({ board }: { board: BoardStats }) {
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [color, setColor] = useState(DEFAULT_COLOR)

  useEffect(() => {
    setColor(getBoardColor(board.id))
  }, [board.id])

  function handleColorChange(c: { id: string; hex: string }) {
    setColor(c)
    localStorage.setItem(`board-color-${board.id}`, c.id)
  }

  async function handleDuplicate() {
    setDuplicating(true)
    const result = await duplicateBoard(board.id)
    setDuplicating(false)
    if (result.error) alert(result.error)
  }

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
      {/* Color stripe — màu do user chọn, lưu localStorage */}
      <div className="h-1.5 w-full transition-colors" style={{ backgroundColor: color.hex }} />

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
          <DropdownMenuContent align="end" className="w-48">
            {/* Color picker */}
            <div className="px-2 py-1.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                <Palette className="h-3 w-3" /> Màu board
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {BOARD_COLORS.map((c) => (
                  <button
                    key={c.id}
                    className={`h-5 w-5 rounded-full transition-all hover:scale-110 ${
                      color.id === c.id ? "ring-2 ring-offset-1 ring-offset-background scale-110" : "opacity-70 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.id}
                    onClick={() => handleColorChange(c)}
                  />
                ))}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2"
              onClick={handleDuplicate}
              disabled={duplicating || deleting}
            >
              {duplicating
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Copy className="h-3.5 w-3.5" />}
              Nhân bản board
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive gap-2"
              onClick={handleDelete}
              disabled={deleting || duplicating}
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
