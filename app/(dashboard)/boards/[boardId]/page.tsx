type BoardPageProps = {
  params: Promise<{ boardId: string }>
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Board: {boardId}</h1>
      {/* TODO: Phase 4 — Kanban board view */}
    </div>
  )
}
