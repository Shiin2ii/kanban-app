"use client"

import { useState, useRef } from "react"
import { updateBoard } from "@/lib/actions/boards"

type BoardTitleEditorProps = {
  boardId: string
  title: string
}

export function BoardTitleEditor({ boardId, title }: BoardTitleEditorProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSave() {
    const trimmed = value.trim()
    if (!trimmed) { setValue(title); setEditing(false); return }
    if (trimmed !== title) await updateBoard(boardId, trimmed)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave()
          if (e.key === "Escape") { setValue(title); setEditing(false) }
        }}
        className="text-base font-semibold bg-transparent border-b border-primary outline-none truncate w-full max-w-xs"
      />
    )
  }

  return (
    <h1
      className="text-base font-semibold truncate cursor-pointer hover:text-primary transition-colors"
      onClick={() => setEditing(true)}
      title="Click để đổi tên board"
    >
      {value}
    </h1>
  )
}
