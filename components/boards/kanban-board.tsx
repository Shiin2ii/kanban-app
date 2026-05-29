"use client"

import { useState, useEffect } from "react"
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
import { KanbanColumn } from "@/components/boards/kanban-column"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createColumn } from "@/lib/actions/columns"
import { moveTask } from "@/lib/actions/tasks"
import { createBrowserClient } from "@/lib/supabase/client"
import type { BoardWithColumns, ColumnWithTasks } from "@/types"
import { Plus } from "lucide-react"

type KanbanBoardProps = {
  board: BoardWithColumns
}

export function KanbanBoard({ board }: KanbanBoardProps) {
  const router = useRouter()
  const [columns, setColumns] = useState<ColumnWithTasks[]>(board.columns)
  const [addingColumn, setAddingColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState("")
  const [pending, setPending] = useState(false)

  // Sync state khi server revalidate (sau khi thêm/xóa task/column)
  useEffect(() => {
    setColumns(board.columns)
  }, [board.columns])

  // Realtime subscription — tự cập nhật khi có thay đổi
  useEffect(() => {
    const supabase = createBrowserClient()

    const channel = supabase
      .channel(`board-${board.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "columns", filter: `board_id=eq.${board.id}` },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => router.refresh(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [board.id, router])

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

    const sourceColumn = findColumnByTaskId(activeId)
    if (!sourceColumn) return

    // over có thể là task id (cùng/khác cột) hoặc column id (empty column)
    const targetColumn =
      findColumnByTaskId(overId) ?? columns.find((col) => col.id === overId)
    if (!targetColumn) return

    const draggedTask = sourceColumn.tasks.find((t) => t.id === activeId)
    if (!draggedTask) return

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
  }

  async function handleAddColumn() {
    if (!newColumnTitle.trim()) return
    setPending(true)
    await createColumn(board.id, newColumnTitle)
    setNewColumnTitle("")
    setAddingColumn(false)
    setPending(false)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-6 overflow-x-auto flex-1 items-start">
        {columns.map((column) => (
          <KanbanColumn key={column.id} column={column} boardId={board.id} />
        ))}

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
  )
}
