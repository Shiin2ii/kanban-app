"use client"

import { useState, useEffect, useMemo, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  closestCorners,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { KanbanColumn } from "@/components/boards/kanban-column"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createColumn, reorderColumns } from "@/lib/actions/columns"
import { moveTask } from "@/lib/actions/tasks"
import { createBrowserClient } from "@/lib/supabase/client"
import type { BoardWithColumns, ColumnWithTasks } from "@/types"
import { Plus, CheckCheck, Search, Share2, EyeOff, Eye, FileDown, Minimize2, Maximize2, Circle, CalendarDays, AlertTriangle, Keyboard } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

type PriorityFilter = "all" | "high" | "medium" | "low" | "done" | "today" | "overdue"

const BOARD_COLORS = [
  { id: "slate",  hex: "#64748b" },
  { id: "blue",   hex: "#3b82f6" },
  { id: "violet", hex: "#8b5cf6" },
  { id: "pink",   hex: "#ec4899" },
  { id: "green",  hex: "#22c55e" },
  { id: "orange", hex: "#f97316" },
  { id: "red",    hex: "#ef4444" },
]

type KanbanBoardProps = {
  board: BoardWithColumns
}

export function KanbanBoard({ board }: KanbanBoardProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [columns, setColumns] = useState<ColumnWithTasks[]>(board.columns)
  const channelRef = useRef<ReturnType<ReturnType<typeof createBrowserClient>["channel"]> | null>(null)
  const [addingColumn, setAddingColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState("")
  const [pending, setPending] = useState(false)
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [hideCompleted, setHideCompleted] = useState(false)
  const [collapseAll, setCollapseAll] = useState<boolean | null>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const stats = useMemo(() => {
    const allTasks = columns.flatMap((c) => c.tasks)
    const total = allTasks.length
    const done = allTasks.filter((t) => t.is_completed).length
    const highPriority = allTasks.filter((t) => t.priority === "high" && !t.is_completed).length
    const today = new Date().toISOString().split("T")[0]
    const overdue = allTasks.filter((t) => t.due_date && t.due_date < today && !t.is_completed).length
    return { total, done, highPriority, overdue }
  }, [columns])

  const [boardColor, setBoardColor] = useState("blue")

  useEffect(() => {
    const saved = localStorage.getItem(`board-color-${board.id}`)
    if (saved) setBoardColor(saved)
  }, [board.id])

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]
    const overdueList = board.columns
      .flatMap((c) => c.tasks)
      .filter((t) => t.due_date && t.due_date < today && !t.is_completed)
    if (overdueList.length > 0) {
      toast.warning(`${overdueList.length} task đã quá hạn!`, {
        description: overdueList.slice(0, 3).map((t) => t.title).join(", ") + (overdueList.length > 3 ? "..." : ""),
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      const isEditing = tag === "INPUT" || tag === "TEXTAREA"
      if (e.key === "/" && !isEditing) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === "?" && !isEditing) {
        e.preventDefault()
        setShowShortcuts((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function handleColorChange(color: string) {
    setBoardColor(color)
    localStorage.setItem(`board-color-${board.id}`, color)
  }

  // Sync state khi server revalidate (sau khi thêm/xóa task/column)
  useEffect(() => {
    setColumns(board.columns)
  }, [board.columns])

  // Realtime subscription — tự cập nhật khi có thay đổi
  useEffect(() => {
    const supabase = createBrowserClient()
    const refresh = () => startTransition(() => router.refresh())

    const channel = supabase
      .channel(`board-${board.id}`)
      // Broadcast: nhận tín hiệu từ tab khác sau mỗi mutation
      .on("broadcast", { event: "board-update" }, refresh)
      // Postgres changes: backup cho columns (ít RLS phức tạp hơn)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "columns", filter: `board_id=eq.${board.id}` },
        refresh,
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          channelRef.current = channel
          toast.success("Realtime connected", { id: "rt-status", duration: 2000 })
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          toast.error(`Realtime ${status}${err ? ": " + err.message : ""}`, { id: "rt-status" })
        }
      })

    return () => {
      channelRef.current = null
      void supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.id])

  function broadcastUpdate() {
    channelRef.current?.send({ type: "broadcast", event: "board-update", payload: {} })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  function findColumnByTaskId(taskId: string): ColumnWithTasks | undefined {
    return columns.find((col) => col.tasks.some((t) => t.id === taskId))
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId === overId) return

    // Column reorder
    if (columns.some((c) => c.id === activeId)) {
      const isOverColumn = columns.some((c) => c.id === overId)
      if (!isOverColumn) return
      const oldIndex = columns.findIndex((c) => c.id === activeId)
      const newIndex = columns.findIndex((c) => c.id === overId)
      const reordered = arrayMove(columns, oldIndex, newIndex)
      setColumns(reordered)
      await reorderColumns(board.id, reordered.map((c) => c.id))
      broadcastUpdate()
      return
    }

    const sourceColumn = findColumnByTaskId(activeId)
    if (!sourceColumn) return

    // over có thể là task id (cùng/khác cột) hoặc column id (empty column)
    const targetColumn =
      findColumnByTaskId(overId) ?? columns.find((col) => col.id === overId)
    if (!targetColumn) return

    const draggedTask = sourceColumn.tasks.find((t) => t.id === activeId)
    if (!draggedTask) return

    // Same-column reorder
    if (sourceColumn.id === targetColumn.id) {
      const oldIndex = sourceColumn.tasks.findIndex((t) => t.id === activeId)
      const newIndex = sourceColumn.tasks.findIndex((t) => t.id === overId)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return
      const reordered = arrayMove(sourceColumn.tasks, oldIndex, newIndex)
      setColumns((prev) =>
        prev.map((col) =>
          col.id === sourceColumn.id ? { ...col, tasks: reordered } : col
        )
      )
      await Promise.all(reordered.map((t, idx) => moveTask(board.id, t.id, sourceColumn.id, idx)))
      broadcastUpdate()
      return
    }

    const newPosition = targetColumn.tasks.filter((t) => t.id !== activeId).length

    // Optimistic update
    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === sourceColumn.id && col.id !== targetColumn.id) {
          return { ...col, tasks: col.tasks.filter((t) => t.id !== activeId) }
        }
        if (col.id === targetColumn.id && col.id !== sourceColumn.id) {
          return { ...col, tasks: [...col.tasks, draggedTask] }
        }
        return col
      }),
    )

    await moveTask(board.id, activeId, targetColumn.id, newPosition)
    broadcastUpdate()
  }

  function handleExport() {
    const lines: string[] = [`# ${board.title}`, ""]
    for (const col of columns) {
      const done = col.tasks.filter((t) => t.is_completed).length
      lines.push(`## ${col.title} (${done}/${col.tasks.length})`)
      if (col.tasks.length === 0) {
        lines.push("_(không có task)_")
      } else {
        for (const t of col.tasks) {
          const check = t.is_completed ? "[x]" : "[ ]"
          const pri = t.priority === "high" ? " [cao]" : t.priority === "low" ? " [thap]" : ""
          const due = t.due_date ? ` (${t.due_date})` : ""
          lines.push(`- ${check} ${t.title}${pri}${due}`)
          if (t.description) lines.push(`  > ${t.description}`)
        }
      }
      lines.push("")
    }
    void navigator.clipboard.writeText(lines.join("\n")).then(() => {
      toast.success("Đã sao chép nội dung board!", { description: "Dạng Markdown, có thể dán vào Notion, GitHub..." })
    })
  }

  async function handleAddColumn() {
    if (!newColumnTitle.trim()) return
    setPending(true)
    await createColumn(board.id, newColumnTitle)
    setNewColumnTitle("")
    setAddingColumn(false)
    setPending(false)
  }

  const columnMeta = useMemo(() => columns.map((c) => ({ id: c.id, title: c.title })), [columns])

  return (
    <>
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      {/* Toolbar */}
      <div className="px-6 pt-4 pb-0 space-y-2" style={{ borderLeft: `3px solid ${BOARD_COLORS.find((c) => c.id === boardColor)?.hex ?? "#3b82f6"}` }}>
        <div className="flex items-center gap-1.5 flex-wrap">
        {(["all", "high", "medium", "low", "done", "today", "overdue"] as PriorityFilter[]).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={priorityFilter === f ? "default" : "ghost"}
            className={`h-7 text-xs px-3 ${
              f === "high" && priorityFilter !== f ? "text-red-500" :
              f === "medium" && priorityFilter !== f ? "text-amber-500" :
              f === "low" && priorityFilter !== f ? "text-blue-500" :
              f === "done" && priorityFilter !== f ? "text-emerald-500" :
              f === "today" && priorityFilter !== f ? "text-cyan-500" :
              f === "overdue" && priorityFilter !== f ? "text-orange-500" : ""
            }`}
            onClick={() => setPriorityFilter(f)}
          >
            {f === "all" ? "Tất cả" :
             f === "high" ? <><Circle className="h-2 w-2 mr-1 fill-current" />Cao</> :
             f === "medium" ? <><Circle className="h-2 w-2 mr-1 fill-current" />Vừa</> :
             f === "low" ? <><Circle className="h-2 w-2 mr-1 fill-current" />Thấp</> :
             f === "done" ? <><CheckCheck className="h-3 w-3 mr-1" />Hoàn thành</> :
             f === "today" ? <><CalendarDays className="h-3 w-3 mr-1" />Hôm nay</> :
             <><AlertTriangle className="h-3 w-3 mr-1" />Quá hạn</>}
          </Button>
        ))}
          {/* Color picker */}
          <div className="flex items-center gap-1 ml-1 pl-1 border-l border-border/50">
            {BOARD_COLORS.map((c) => (
              <button
                key={c.id}
                className={`h-3.5 w-3.5 rounded-full transition-all ${
                  boardColor === c.id ? "ring-2 ring-offset-1 ring-offset-background scale-110" : "hover:scale-110 opacity-70 hover:opacity-100"
                }`}
                style={{ backgroundColor: c.hex, outlineColor: c.hex }}
                onClick={() => handleColorChange(c.id)}
                title={c.id}
              />
            ))}
          </div>
          {/* Copy board URL */}
          <button
            className="ml-1 pl-1 border-l border-border/50 text-muted-foreground hover:text-foreground transition-colors"
            title="Sao chép link board"
            onClick={async () => {
              await navigator.clipboard.writeText(window.location.href)
              toast.success("Đã sao chép link board!")
            }}
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
          {/* Hide completed */}
          <button
            className={`ml-1 pl-1 border-l border-border/50 transition-colors ${
              hideCompleted ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-foreground"
            }`}
            title={hideCompleted ? "Hiện task đã xong" : "Ẩn task đã xong"}
            onClick={() => setHideCompleted((v) => !v)}
          >
            {hideCompleted ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          {/* Export board */}
          <button
            className="ml-1 pl-1 border-l border-border/50 text-muted-foreground hover:text-foreground transition-colors"
            title="Xuất board (Markdown)"
            onClick={handleExport}
          >
            <FileDown className="h-3.5 w-3.5" />
          </button>
          {/* Collapse/expand all */}
          <button
            className={`ml-1 pl-1 border-l border-border/50 transition-colors ${
              collapseAll === true ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-foreground"
            }`}
            title={collapseAll === true ? "Mở rộng tất cả cột" : "Gấp tất cả cột"}
            onClick={() => setCollapseAll((v) => (v === true ? false : true))}
          >
            {collapseAll === true
              ? <Maximize2 className="h-3.5 w-3.5" />
              : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
          {/* Keyboard shortcuts help */}
          <button
            className="ml-1 pl-1 border-l border-border/50 text-muted-foreground hover:text-foreground transition-colors"
            title="Phím tắt (?)"
            onClick={() => setShowShortcuts(true)}
          >
            <Keyboard className="h-3.5 w-3.5" />
          </button>
          <div className="ml-auto relative flex items-center">
            <Search className="absolute left-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm task... (/)"
              className="h-7 pl-7 pr-2 text-xs w-44"
            />
          </div>
        </div>
        {stats.total > 0 && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground pb-1">
            <span className="font-medium text-foreground">{stats.total} tasks</span>
            <span className="flex items-center gap-1 text-emerald-500"><CheckCheck className="h-3 w-3" />{stats.done} hoàn thành ({Math.round(stats.done / stats.total * 100)}%)</span>
            {stats.highPriority > 0 && <span className="flex items-center gap-1 text-red-500"><Circle className="h-2 w-2 fill-current" />{stats.highPriority} ưu tiên cao</span>}
            {stats.overdue > 0 && <span className="flex items-center gap-1 text-orange-500"><AlertTriangle className="h-3 w-3" />{stats.overdue} quá hạn</span>}
          </div>
        )}
      </div>

      <div className="flex gap-4 p-6 overflow-x-auto flex-1 items-start">
        <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
          {columns.map((column) => (
            <KanbanColumn key={column.id} column={column} boardId={board.id} priorityFilter={priorityFilter} searchQuery={searchQuery} hideCompleted={hideCompleted} collapseAll={collapseAll} allColumns={columnMeta} onMutate={broadcastUpdate} />
          ))}
        </SortableContext>

        {/* Add column */}
        <div className="shrink-0 w-72">
          {addingColumn ? (
            <div className="bg-muted rounded-lg p-3 space-y-2">
              <Input
                autoFocus
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="Tên cột..."
                disabled={pending}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddColumn()
                  if (e.key === "Escape") setAddingColumn(false)
                }}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddColumn} disabled={pending}>
                  {pending ? "Đang thêm..." : "Thêm cột"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAddingColumn(false)}>
                  Hủy
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 hover:text-foreground hover:bg-transparent h-10"
              onClick={() => setAddingColumn(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm cột
            </Button>
          )}
        </div>
      </div>
    </DndContext>

    <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            Phím tắt
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1 text-sm">
          {([
            ["/", "Tìm kiếm task"],
            ["?", "Mở/đóng bảng phím tắt"],
            ["Esc", "Đóng modal / Bỏ chọn"],
            ["Drag", "Kéo thả task hoặc cột"],
            ["Click cột", "Gấp / mở rộng cột"],
            ["Click ưu tiên", "Đổi ưu tiên nhanh"],
            ["Chuột phải", "Mở menu ngữ cảnh task"],
          ] as [string, string][]).map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
              <span className="text-muted-foreground">{desc}</span>
              <kbd className="px-2 py-0.5 text-xs font-mono rounded bg-muted border border-border">{key}</kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
