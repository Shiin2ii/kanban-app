"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { TaskCard } from "@/components/tasks/task-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createTask } from "@/lib/actions/tasks"
import { deleteColumn } from "@/lib/actions/columns"
import type { ColumnWithTasks } from "@/types"

type KanbanColumnProps = {
  column: ColumnWithTasks
  boardId: string
}

export function KanbanColumn({ column, boardId }: KanbanColumnProps) {
  const [addingTask, setAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [pending, setPending] = useState(false)

  const { setNodeRef } = useDroppable({ id: column.id })

  async function handleAddTask() {
    if (!newTaskTitle.trim()) return
    setPending(true)
    await createTask(boardId, column.id, newTaskTitle)
    setNewTaskTitle("")
    setAddingTask(false)
    setPending(false)
  }

  async function handleDeleteColumn() {
    if (!confirm(`Xóa cột "${column.title}" và tất cả task trong đó?`)) return
    await deleteColumn(boardId, column.id)
  }

  return (
    <div className="shrink-0 w-72 bg-muted/50 rounded-lg flex flex-col max-h-full">
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-semibold text-sm truncate">{column.title}</h3>
          <span className="shrink-0 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {column.tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={handleDeleteColumn}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Tasks */}
      <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className="flex flex-col gap-2 p-2 overflow-y-auto flex-1 min-h-8"
        >
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} boardId={boardId} />
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
                  if (e.key === "Enter") handleAddTask()
                  if (e.key === "Escape") setAddingTask(false)
                }}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddTask} disabled={pending}>
                  {pending ? "Đang thêm..." : "Thêm"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAddingTask(false)}>
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
    </div>
  )
}