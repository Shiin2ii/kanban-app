import type { Database } from "./database.types"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Board = Database["public"]["Tables"]["boards"]["Row"]
export type Column = Database["public"]["Tables"]["columns"]["Row"]
export type Task = Database["public"]["Tables"]["tasks"]["Row"]
export type TaskAttachment = Database["public"]["Tables"]["task_attachments"]["Row"]

export type BoardInsert = Database["public"]["Tables"]["boards"]["Insert"]
export type ColumnInsert = Database["public"]["Tables"]["columns"]["Insert"]
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"]

export type ColumnWithTasks = Column & {
  tasks: Task[]
}

export type BoardWithColumns = Board & {
  columns: ColumnWithTasks[]
}

export type BoardStats = Board & {
  taskCount: number
  doneCount: number
  overdueCount: number
}

export type Notification = Database["public"]["Tables"]["notifications"]["Row"]

export type NotificationType = "task_overdue" | "task_due_today" | "task_completed" | "board_created"

export type ActionResult<T> = {
  data: T | null
  error: string | null
}
