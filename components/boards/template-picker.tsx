"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { LayoutTemplate, ChevronRight, Loader2, Check, Columns3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createBoardFromTemplate } from "@/lib/actions/boards"
import { BOARD_TEMPLATES, type BoardTemplate } from "@/lib/templates"
import { cn } from "@/lib/utils"

const COLOR_HEX: Record<string, string> = {
  blue:   "#3b82f6",
  violet: "#8b5cf6",
  green:  "#22c55e",
  pink:   "#ec4899",
  orange: "#f97316",
  red:    "#ef4444",
  slate:  "#64748b",
}

export function TemplatePicker() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"pick" | "name">("pick")
  const [selected, setSelected] = useState<BoardTemplate | null>(null)
  const [customTitle, setCustomTitle] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSelect(t: BoardTemplate) {
    setSelected(t)
    setCustomTitle(t.name)
    setError(null)
    setStep("name")
  }

  function handleBack() {
    setStep("pick")
    setSelected(null)
    setError(null)
  }

  function handleCreate() {
    if (!selected) return
    setError(null)
    startTransition(async () => {
      const result = await createBoardFromTemplate(selected.id, customTitle)
      if (result.error) {
        setError(result.error)
        return
      }
      // Lưu màu vào localStorage
      if (result.data) {
        localStorage.setItem(`board-color-${result.data.id}`, selected.color)
        setOpen(false)
        setStep("pick")
        setSelected(null)
        router.push(`/boards/${result.data.id}`)
      }
    })
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) {
      setStep("pick")
      setSelected(null)
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={
        <Button variant="outline">
          <LayoutTemplate className="h-4 w-4 mr-1.5" />
          Từ mẫu
        </Button>
      } />

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5" />
            {step === "pick" ? "Chọn template" : "Đặt tên board"}
          </DialogTitle>
        </DialogHeader>

        {step === "pick" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 max-h-[480px] overflow-y-auto pr-1">
            {BOARD_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelect(t)}
                className="group flex flex-col gap-2 rounded-lg border p-4 text-left hover:border-primary hover:bg-accent transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-md text-lg"
                      style={{ backgroundColor: `${COLOR_HEX[t.color]}20`, color: COLOR_HEX[t.color] }}
                    >
                      {t.emoji}
                    </span>
                    <span className="font-semibold text-sm">{t.name}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>

                {/* Columns preview */}
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  <Columns3 className="h-3 w-3 text-muted-foreground shrink-0" />
                  {t.columns.map((c) => (
                    <span
                      key={c.title}
                      className="text-[10px] rounded px-1.5 py-0.5 bg-muted text-muted-foreground"
                    >
                      {c.title}
                    </span>
                  ))}
                </div>

                {/* Task count */}
                <p className="text-[10px] text-muted-foreground">
                  {t.columns.reduce((s, c) => s + c.tasks.length, 0)} task mẫu
                </p>
              </button>
            ))}
          </div>
        )}

        {step === "name" && selected && (
          <div className="space-y-5 mt-2">
            {/* Selected template preview */}
            <div
              className="flex items-center gap-3 rounded-lg border p-3"
              style={{ borderColor: `${COLOR_HEX[selected.color]}60`, backgroundColor: `${COLOR_HEX[selected.color]}0d` }}
            >
              <span className="text-2xl">{selected.emoji}</span>
              <div>
                <p className="font-semibold text-sm">{selected.name}</p>
                <p className="text-xs text-muted-foreground">{selected.description}</p>
              </div>
            </div>

            {/* Columns preview */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {selected.columns.length} cột · {selected.columns.reduce((s, c) => s + c.tasks.length, 0)} task mẫu
              </p>
              <div className="flex gap-2 flex-wrap">
                {selected.columns.map((col) => (
                  <div key={col.title} className="rounded-md border px-2.5 py-1.5 text-xs">
                    <span className="font-medium">{col.title}</span>
                    {col.tasks.length > 0 && (
                      <span className="ml-1 text-muted-foreground">({col.tasks.length})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Title input */}
            <div className="space-y-2">
              <Label htmlFor="board-title">Tên board</Label>
              <Input
                id="board-title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Nhập tên board..."
                disabled={isPending}
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate() }}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={handleBack} disabled={isPending}>
                ← Quay lại
              </Button>
              <Button onClick={handleCreate} disabled={isPending || !customTitle.trim()}>
                {isPending ? (
                  <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Đang tạo...</>
                ) : (
                  <><Check className="h-4 w-4 mr-1.5" />Tạo board</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
