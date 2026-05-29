import { getBoards } from "@/lib/actions/boards"
import { BoardList } from "@/components/boards/board-list"
import { CreateBoardDialog } from "@/components/boards/create-board-dialog"

export default async function BoardsPage() {
  const boards = await getBoards()

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">Boards của tôi</h1>
        <CreateBoardDialog />
      </div>
      <p className="text-muted-foreground mb-8 text-sm">
        {boards.length > 0
          ? `${boards.length} board · chọn một board để bắt đầu làm việc`
          : "Tạo board đầu tiên để bắt đầu quản lý công việc"}
      </p>
      <BoardList boards={boards} />
    </div>
  )
}
