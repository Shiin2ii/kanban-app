"use client"

import { useState, useEffect } from "react"
import { X, ChevronDown, ChevronRight, ArrowUpDown, Flame, CalendarDays, GripVertical, Trash2 } from "lucide-react"
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { TaskCard } from "@/components/tasks/task-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createTask, clearCompletedTasks } from "@/lib/actions/tasks"
import { deleteColumn, updateColumnTitle } from "@/lib/actions/columns"
import type { ColumnWithTasks } from "@/types"

const COLUMN_COLORS = [
  { id: "default", hex: "" },
  { id: "blue",    hex: "#3b82f6" },
  { id: "green",   hex: "#22c55e" },
  { id: "yellow",  hex: "#eab308" },
  { id: "orange",  hex: "#f97316" },
  { id: "red",     hex: "#ef4444" },
  { id: "violet",  hex: "#8b5cf6" },
]

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

type SortBy = "default" | "priority" | "due_date"

type KanbanColumnProps = {
  column: ColumnWithTasks
  boardId: string
  priorityFilter?: string
  searchQuery?: string
  hideCompleted?: boolean
  collapseAll?: boolean | null
  allColumns?: { id: string; title: string }[]
}

export function KanbanColumn({ column, boardId, priorityFilter = "all", searchQuery = "", hideCompleted = false, collapseAll = null, allColumns }: KanbanColumnProps) {
  const [addingTask, setAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState("medium")
  const [newTaskDueDate, setNewTaskDueDate] = useState("")
  const [pending, setPending] = useState(false)

  const [editingTitle, setEditingTitle] = useState(false)
  const [columnTitle, setColumnTitle] = useState(column.title)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id })

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  async function handleAddTask() {
    if (!newTaskTitle.trim()) return
    setPending(true)
    await createTask(boardId, column.id, newTaskTitle, newTaskDescription, newTaskPriority, newTaskDueDate || undefined)
    setNewTaskTitle("")
    setNewTaskDescription("")
    setNewTaskPriority("medium")
    setNewTaskDueDate("")
    setAddingTask(false)
    setPending(false)
  }

  async function handleDeleteColumn() {
    if (!confirm(`Xóa cột "${column.title}" và tất cả task trong đó?`)) return
    await deleteColumn(boardId, column.id)
  }

  async function handleRenameColumn() {
    const trimmed = columnTitle.trim()
    if (!trimmed) { setColumnTitle(column.title); setEditingTitle(false); return }
    if (trimmed !== column.title) await updateColumnTitle(boardId, column.id, trimmed)
    setEditingTitle(false)
  }

  async function handleClearCompleted() {
    const count = column.tasks.filter((t) => t.is_completed).length
    if (!confirm(`Xóa ${count} task đã hoàn thành trong cột này?`)) return
    await clearCompletedTasks(boardId, column.id)
  }

  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (collapseAll !== null) setCollapsed(collapseAll)
  }, [collapseAll])

  const [sortBy, setSortBy] = useState<SortBy>("default")
  const [columnColor, setColumnColor] = useState("default")

  useEffect(() => {
    const saved = localStorage.getItem(`column-color-${column.id}`)
    if (saved) setColumnColor(saved)
  }, [column.id])

  function handleColumnColorChange(colorId: string) {
    setColumnColor(colorId)
    localStorage.setItem(`column-color-${column.id}`, colorId)
  }

  const sortedAndFilteredTasks = [...column.tasks]
    .sort((a, b) => {
      if (sortBy === "priority") {
        return (PRIORITY_ORDER[a.priority ?? "medium"] ?? 1) - (PRIORITY_ORDER[b.priority ?? "medium"] ?? 1)
      }
      if (sortBy === "due_date") {
        return (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999")
      }
      return 0
    })
    .filter((t) => !(hideCompleted && (t.is_completed ?? false)))
    .filter((t) => {
      if (priorityFilter === "all") return true
      if (priorityFilter === "done") return t.is_completed ?? false
      if (priorityFilter === "today") {
        const today = new Date().toISOString().split("T")[0]
        return t.due_date === today
      }
      if (priorityFilter === "overdue") {
        const today = new Date().toISOString().split("T")[0]
        return !!(t.due_date && t.due_date < today && !t.is_completed)
      }
      return (t.priority ?? "medium") === priorityFilter
    })
    .filter((t) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return t.title.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q)
    })

  const accentStyle = columnColor !== "default"
    ? { borderLeft: `3px solid ${COLUMN_COLORS.find((c) => c.id === columnColor)?.hex}` }
    : {}

  return (
    <div
      ref={setNodeRef}
      style={{ ...sortableStyle, ...accentStyle }}
      className={`shrink-0 bg-muted/50 rounded-lg flex flex-col max-h-full transition-all duration-300 ${collapsed ? "w-12" : "w-72"} ${isDragging ? "opacity-50 ring-2 ring-primary/50 z-50" : ""}`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-2 py-2.5 border-b border-border/50 gap-1">
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing"
          title="Kéo để sắp xếp cột"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <button
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Mở rộng" : "Thu nhỏ"}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {!collapsed && (
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {editingTitle ? (
              <Input
                autoFocus
                value={columnTitle}
                onChange={(e) => setColumnTitle(e.target.value)}
                className="h-6 text-sm font-semibold px-1 py-0 w-full"
                onBlur={handleRenameColumn}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameColumn()
                  if (e.key === "Escape") { setColumnTitle(column.title); setEditingTitle(false) }
                }}
              />
            ) : (
              <h3
                className="font-semibold text-sm truncate cursor-pointer hover:text-primary transition-colors"
                onClick={() => setEditingTitle(true)}
                title="Click để đổi tên"
              >
                {columnTitle}
              </h3>
            )}
            <span className="shrink-0 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {sortedAndFilteredTasks.length}/{column.tasks.length}
            </span>
          </div>
        )}
        {!collapsed && (
          <button
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setSortBy((s) => s === "default" ? "priority" : s === "priority" ? "due_date" : "default")}
            title={sortBy === "default" ? "Mặc định" : sortBy === "priority" ? "Theo priority" : "Theo ngày hết hạn"}
          >
            {sortBy === "default" && <ArrowUpDown className="h-3.5 w-3.5" />}
            {sortBy === "priority" && <Flame className="h-3.5 w-3.5 text-orange-500" />}
            {sortBy === "due_date" && <CalendarDays className="h-3.5 w-3.5 text-blue-500" />}
          </button>
        )}
        {!collapsed && column.tasks.some((t) => t.is_completed) && (
          <button
            className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
            onClick={handleClearCompleted}
            title="Xóa task đã hoàn thành"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={handleDeleteColumn}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Column color picker */}
      {!collapsed && (
        <div className="flex items-center gap-1 px-3 pt-1.5 pb-0">
          {COLUMN_COLORS.map((c) => (
            <button
              key={c.id}
              className={`h-3 w-3 rounded-full border border-border/50 transition-all ${
                columnColor === c.id
                  ? "ring-1 ring-ring ring-offset-1 ring-offset-background scale-110"
                  : "hover:scale-110 opacity-60 hover:opacity-100"
              }`}
              style={c.hex ? { backgroundColor: c.hex, borderColor: c.hex } : {}}
              onClick={() => handleColumnColorChange(c.id)}
              title={c.id === "default" ? "Không màu" : c.id}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {!collapsed && column.tasks.length > 0 && (() => {
        const done = column.tasks.filter((t) => t.is_completed).length
        const pct = Math.round((done / column.tasks.length) * 100)
        return (
          <div className="px-3 pt-2 pb-0">
            <div className="h-1 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{done}/{column.tasks.length} hoàn thành</p>
          </div>
        )
      })()}

      {/* Tasks */}
      {!collapsed && (
      <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          className="flex flex-col gap-2 p-2 overflow-y-auto flex-1 min-h-8"
        >
          {sortedAndFilteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} boardId={boardId} columnId={column.id} allColumns={allColumns} searchQuery={searchQuery} />
          ))}

          {addingTask ? (
            <div className="space-y-2">
              <Input
                autoFocus
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Tên task..."
                disabled={pending}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setAddingTask(false); setNewTaskDescription(""); setNewTaskPriority("medium"); setNewTaskDueDate("") }
                }}
              />
              <Textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Mô tả (không bắt buộc)..."
                disabled={pending}
                rows={2}
                className="resize-none text-sm"
              />
              <div className="flex gap-2">
                <Select value={newTaskPriority} onValueChange={setNewTaskPriority} disabled={pending}>
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Uưu tiên cao</SelectItem>
                    <SelectItem value="medium">Uưu tiên vừa</SelectItem>
                    <SelectItem value="low">Uưu tiên thấp</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  disabled={pending}
                  className="h-8 text-xs flex-1"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddTask} disabled={pending}>
                  {pending ? "Đang thêm..." : "Thêm"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setAddingTask(false); setNewTaskDescription(""); setNewTaskPriority("medium"); setNewTaskDueDate("") }}>
                  Hủy
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="justify-start text-muted-foreground w-full"
              onClick={() => setAddingTask(true)}
            >
              + Thêm task
            </Button>
          )}
        </div>
      </SortableContext>
      )}
    </div>
  )
}