import { getBoardsWithStats } from "@/lib/actions/boards"
import { generateDueDateNotifications } from "@/lib/actions/notifications"
import { createServerClient } from "@/lib/supabase/server"
import { BoardList } from "@/components/boards/board-list"
import { CreateBoardDialog } from "@/components/boards/create-board-dialog"
import { TemplatePicker } from "@/components/boards/template-picker"
import { ClipboardList, CheckCheck, Loader, AlertTriangle } from "lucide-react"

export default async function BoardsPage() {
  const supabase = await createServerClient()
  const [boards, { data: { user } }] = await Promise.all([
    getBoardsWithStats(),
    supabase.auth.getUser(),
  ])

  // Tạo thông báo quá hạn / đến hạn hôm nay
  await generateDueDateNotifications()

  const username = user?.user_metadata?.username as string | undefined
  const totalTasks = boards.reduce((s, b) => s + b.taskCount, 0)
  const totalDone = boards.reduce((s, b) => s + b.doneCount, 0)
  const totalOverdue = boards.reduce((s, b) => s + b.overdueCount, 0)
  const inProgress = totalTasks - totalDone - totalOverdue
  const donePercent = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold">
            {username ? `Xin chào, ${username}!` : "Boards của tôi"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {boards.length > 0
              ? `${boards.length} board · chọn một board để bắt đầu làm việc`
              : "Tạo board đầu tiên để bắt đầu quản lý công việc"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TemplatePicker />
          <CreateBoardDialog />
        </div>
      </div>

      {totalTasks > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="rounded-xl bg-muted px-4 py-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ClipboardList className="h-3.5 w-3.5" />
              Tổng task
            </div>
            <p className="text-2xl font-bold">{totalTasks}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCheck className="h-3.5 w-3.5" />
              Hoàn thành
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {totalDone}
              <span className="text-sm font-normal text-muted-foreground ml-1">({donePercent}%)</span>
            </p>
          </div>
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 px-4 py-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader className="h-3.5 w-3.5" />
              Đang làm
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgress > 0 ? inProgress : 0}</p>
          </div>
          <div className={`rounded-xl px-4 py-3 flex flex-col gap-1 ${totalOverdue > 0 ? "bg-red-50 dark:bg-red-950/30" : "bg-muted"}`}>
            <div className={`flex items-center gap-1.5 text-xs ${totalOverdue > 0 ? "text-red-500" : "text-muted-foreground"}`}>
              <AlertTriangle className="h-3.5 w-3.5" />
              Quá hạn
            </div>
            <p className={`text-2xl font-bold ${totalOverdue > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
              {totalOverdue}
            </p>
          </div>
        </div>
      )}

      <BoardList boards={boards} />
    </div>
  )
}

