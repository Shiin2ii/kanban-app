import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"
import { getBoardWithColumns } from "@/lib/actions/columns"
import { KanbanBoard } from "@/components/boards/kanban-board"

type BoardPageProps = {
  params: Promise<{ boardId: string }>
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params
  const board = await getBoardWithColumns(boardId)

  if (!board) notFound()

  const totalTasks = board.columns.reduce((acc, c) => acc + c.tasks.length, 0)

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="px-6 py-3 border-b flex items-center gap-3 bg-background">
        <Link
          href="/boards"
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="Quay lại"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="h-4 w-px bg-border" />
        <h1 className="text-base font-semibold truncate">{board.title}</h1>
        <span className="text-xs text-muted-foreground shrink-0">
          {board.columns.length} cột · {totalTasks} task
        </span>
      </div>
      <KanbanBoard board={board} />
    </div>
  )
}
