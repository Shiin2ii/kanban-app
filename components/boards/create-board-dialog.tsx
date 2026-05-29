"use client"

import { useActionState } from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBoard } from "@/lib/actions/boards"
import type { ActionResult, Board } from "@/types"

const initialState: ActionResult<Board> = { data: null, error: null }

export function CreateBoardDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    async (prev: ActionResult<Board>, formData: FormData) => {
      const result = await createBoard(prev, formData)
      if (!result.error) setOpen(false)
      return result
    },
    initialState
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>+ Tạo board</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo board mới</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tên board</Label>
            <Input
              id="title"
              name="title"
              placeholder="VD: Dự án website..."
              required
              disabled={pending}
              autoFocus
            />
          </div>
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Đang tạo..." : "Tạo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
