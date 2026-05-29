"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { deleteTask, updateTask } from "@/lib/actions/tasks"
import type { Task } from "@/types"

type TaskCardProps = {
  task: Task
  boardId: string
}

export function TaskCard({ task, boardId }: TaskCardProps) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? "")
  const [saving, setSaving] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    await updateTask(boardId, task.id, title, description)
    setSaving(false)
    setEditing(false)
    setOpen(false)
  }

  async function handleDelete() {
    if (!confirm(`Xóa task "${task.title}"?`)) return
    setOpen(false)
    await deleteTask(boardId, task.id)
  }

  return (
    <>
      <div ref={setNodeRef} style={style} className={isDragging ? "opacity-50" : ""}>
        <Card className="hover:shadow-md transition-shadow">
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
            <div className="flex-1 cursor-pointer min-w-0" onClick={() => setOpen(true)}>
              <p className="text-sm font-medium line-clamp-2">{task.title}</p>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {task.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={handleDelete}
                >
                  Xóa
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
