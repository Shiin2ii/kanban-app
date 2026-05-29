"use client"

import { useState, useEffect, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, CalendarDays, Copy, Pencil, Trash2, CheckCircle2, Circle, Flag, Check, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { deleteTask, updateTask, toggleTaskComplete, duplicateTask, moveTask } from "@/lib/actions/tasks"
import type { Task } from "@/types"

type TaskCardProps = {
  task: Task
  boardId: string
  columnId: string
  allColumns?: { id: string; title: string }[]
  searchQuery?: string
  onMutate?: () => void
}

function HighlightText({ text, query }: { text: string; query?: string }) {
  if (!query || !query.trim()) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase().trim())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-500/40 text-inherit rounded-sm px-px">
        {text.slice(idx, idx + query.trim().length)}
      </mark>
      {text.slice(idx + query.trim().length)}
    </>
  )
}

function CtxItem({
  children,
  onClick,
  variant = "default",
}: {
  children: ReactNode
  onClick: () => void
  variant?: "default" | "destructive"
}) {
  return (
    <button
      className={`flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
        variant === "destructive" ? "text-destructive hover:bg-destructive/10 hover:text-destructive" : ""
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

const PRIORITY_CONFIG = {
  high:   { label: "Cao",  className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400" },
  medium: { label: "Vừa",  className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400" },
  low:    { label: "Thấp", className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400" },
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("vi-VN", {
    day: "numeric", month: "short",
  })
}

function isOverdue(dateStr: string) {
  return new Date(dateStr + "T00:00:00") < new Date(new Date().toDateString())
}

function getDaysLabel(dateStr: string, isCompleted: boolean): { label: string; className: string } {
  if (isCompleted) return { label: formatDate(dateStr), className: "text-muted-foreground" }
  const today = new Date(new Date().toDateString())
  const due = new Date(dateStr + "T00:00:00")
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { label: `${Math.abs(diff)}n quá hạn`, className: "text-red-500 font-medium" }
  if (diff === 0) return { label: "Hôm nay", className: "text-amber-500 font-medium" }
  if (diff === 1) return { label: "Ngày mai", className: "text-blue-500 font-medium" }
  return { label: `${diff} ngày`, className: "text-muted-foreground" }
}

export function TaskCard({ task, boardId, columnId, allColumns, searchQuery, onMutate }: TaskCardProps) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [completed, setCompleted] = useState(task.is_completed ?? false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? "")
  const [priority, setPriority] = useState(task.priority ?? "medium")
  const [dueDate, setDueDate] = useState(task.due_date ?? "")
  const [saving, setSaving] = useState(false)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!ctxMenu) return
    const close = () => setCtxMenu(null)
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close() }
    window.addEventListener("click", close)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("click", close)
      window.removeEventListener("keydown", onKey)
    }
  }, [ctxMenu])

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    await updateTask(boardId, task.id, title, description, priority, dueDate || null)
    setSaving(false)
    setEditing(false)
    setOpen(false)
    onMutate?.()
  }

  async function handleDelete() {
    if (!confirm(`Xóa task "${task.title}"?`)) return
    setOpen(false)
    await deleteTask(boardId, task.id)
    onMutate?.()
  }

  async function handleDuplicate() {
    setOpen(false)
    await duplicateTask(boardId, task.id)
    onMutate?.()
  }

  async function handleChangePriority(newPriority: string) {
    setPriority(newPriority)
    await updateTask(boardId, task.id, task.title, task.description ?? undefined, newPriority, task.due_date ?? null)
    onMutate?.()
  }

  function cyclePriority(e: React.MouseEvent) {
    e.stopPropagation()
    const order = ["high", "medium", "low"] as const
    const next = order[(order.indexOf(priority as (typeof order)[number]) + 1) % order.length]
    void handleChangePriority(next)
  }

  async function handleToggleComplete(e: React.MouseEvent) {
    e.stopPropagation()
    const next = !completed
    setCompleted(next)
    await toggleTaskComplete(boardId, task.id, next)
    onMutate?.()
  }

  const priorityCfg = PRIORITY_CONFIG[(priority) as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium
  const overdue = task.due_date ? isOverdue(task.due_date) : false

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={isDragging ? "opacity-50" : ""}
        onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }) }}
      >
        <Card className={`hover:shadow-md transition-shadow ${overdue && !completed ? "ring-1 ring-red-400/50 dark:ring-red-500/50" : ""}`}>
          <CardContent className="p-3 flex items-start gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing mt-0.5 shrink-0 touch-none"
              tabIndex={-1}
              suppressHydrationWarning
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            {/* Done checkbox */}
            <button
              onClick={handleToggleComplete}
              className={`mt-0.5 shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                completed
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "border-muted-foreground/40 hover:border-emerald-400"
              }`}
              title={completed ? "Bỏ hoàn thành" : "Hoàn thành"}
            >
              {completed && <span className="text-[8px] font-bold leading-none">✓</span>}
            </button>
            <div className="flex-1 cursor-pointer min-w-0" onClick={() => setOpen(true)}>
              <p className={`text-sm font-medium line-clamp-2 ${completed ? "line-through text-muted-foreground" : ""}`}>
                <HighlightText text={task.title} query={searchQuery} />
              </p>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {task.description}
                </p>
              )}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 h-4 cursor-pointer select-none transition-opacity hover:opacity-80 ${priorityCfg.className}`}
                  onClick={cyclePriority}
                  title="Click để đổi ưu tiên"
                >
                  {priorityCfg.label}
                </Badge>
                {task.due_date && (() => {
                  const { label, className } = getDaysLabel(task.due_date, completed)
                  return (
                    <span className={`flex items-center gap-0.5 text-[10px] ${className}`}>
                      <CalendarDays className="h-3 w-3" />
                      {label}
                    </span>
                  )
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {ctxMenu && createPortal(
        <div
          className="fixed z-[9999] min-w-[180px] rounded-lg border border-border bg-popover p-1 shadow-md text-popover-foreground"
          style={{
            left: Math.min(ctxMenu.x, window.innerWidth - 196),
            top: Math.min(ctxMenu.y, window.innerHeight - 240),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <CtxItem onClick={() => {
            setCtxMenu(null)
            const next = !completed
            setCompleted(next)
            void toggleTaskComplete(boardId, task.id, next)
          }}>
            {completed
              ? <Circle className="h-4 w-4 text-muted-foreground" />
              : <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            }
            {completed ? "Bỏ hoàn thành" : "Đánh dấu xong"}
          </CtxItem>
          <hr className="-mx-1 my-1 border-t border-border" />
          <CtxItem onClick={() => { setCtxMenu(null); setOpen(true) }}>
            <Pencil className="h-4 w-4" />
            Chỉnh sửa
          </CtxItem>
          <CtxItem onClick={() => { setCtxMenu(null); void handleDuplicate() }}>
            <Copy className="h-4 w-4" />
            Nhân bản
          </CtxItem>
          {allColumns && allColumns.filter((c) => c.id !== columnId).length > 0 && (<>
            <hr className="-mx-1 my-1 border-t border-border" />
            <p className="px-2 py-1 text-[11px] font-medium text-muted-foreground">Chuyển sang</p>
            {allColumns.filter((c) => c.id !== columnId).map((col) => (
              <CtxItem key={col.id} onClick={() => { setCtxMenu(null); void moveTask(boardId, task.id, col.id, 999) }}>
                <ArrowRight className="h-4 w-4" />
                {col.title}
              </CtxItem>
            ))}
          </>)}
          <hr className="-mx-1 my-1 border-t border-border" />
          <p className="px-2 py-1 text-[11px] font-medium text-muted-foreground">Ưu tiên</p>
          <CtxItem onClick={() => { setCtxMenu(null); void handleChangePriority("high") }}>
            <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
            Cao
            {(task.priority ?? "medium") === "high" && <Check className="ml-auto h-3.5 w-3.5" />}
          </CtxItem>
          <CtxItem onClick={() => { setCtxMenu(null); void handleChangePriority("medium") }}>
            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
            Vừa
            {(task.priority ?? "medium") === "medium" && <Check className="ml-auto h-3.5 w-3.5" />}
          </CtxItem>
          <CtxItem onClick={() => { setCtxMenu(null); void handleChangePriority("low") }}>
            <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
            Thấp
            {(task.priority ?? "medium") === "low" && <Check className="ml-auto h-3.5 w-3.5" />}
          </CtxItem>
          <hr className="-mx-1 my-1 border-t border-border" />
          <CtxItem variant="destructive" onClick={() => { setCtxMenu(null); void handleDelete() }}>
            <Trash2 className="h-4 w-4" />
            Xóa task
          </CtxItem>
        </div>,
        document.body
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết task</DialogTitle>
          </DialogHeader>

          {editing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tiêu đề</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  disabled={saving}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Ưu tiên</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v ?? "medium")} disabled={saving}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Cao</SelectItem>
                      <SelectItem value="medium">Vừa</SelectItem>
                      <SelectItem value="low">Thấp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                  Hủy
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{task.title}</p>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                    {task.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Ưu tiên: </span>
                  <Badge variant="outline" className={`text-xs ${priorityCfg.className}`}>
                    {priorityCfg.label}
                  </Badge>
                </div>
                {task.due_date && (
                  <div className={`flex items-center gap-1 text-xs ${overdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(task.due_date)}
                    {overdue && " · Quá hạn"}
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={handleDelete}
                >
                  Xóa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDuplicate}
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Nhân bản
                </Button>
                <Button size="sm" onClick={() => setEditing(true)}>
                  Chỉnh sửa
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
