"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Bell, BellOff, CheckCheck, Trash2, Clock, AlertTriangle, CircleCheck, LayoutGrid, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } from "@/lib/actions/notifications"
import type { Notification } from "@/types"
import { cn } from "@/lib/utils"

type Props = {
  notifications: Notification[]
  unreadCount: number
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  task_overdue:   { icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-500" },
  task_due_today: { icon: <Clock className="h-4 w-4" />,         color: "text-orange-500" },
  task_completed: { icon: <CircleCheck className="h-4 w-4" />,   color: "text-emerald-500" },
  board_created:  { icon: <LayoutGrid className="h-4 w-4" />,    color: "text-blue-500" },
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return "Vừa xong"
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d} ngày trước`
  return new Date(dateStr).toLocaleDateString("vi-VN")
}

export function NotificationBell({ notifications: initial, unreadCount: initialCount }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>(initial)
  const [unreadCount, setUnreadCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleMarkRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
    startTransition(() => markAsRead(id))
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
    startTransition(() => markAllAsRead())
  }

  function handleDelete(id: string, wasUnread: boolean) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1))
    startTransition(() => deleteNotification(id))
  }

  function handleClearAll() {
    setNotifications([])
    setUnreadCount(0)
    startTransition(() => clearAllNotifications())
  }

  function handleClickNotif(notif: Notification) {
    if (!notif.is_read) handleMarkRead(notif.id)
    if (notif.link) router.push(notif.link)
  }

  const config = (type: string) => TYPE_CONFIG[type] ?? TYPE_CONFIG.board_created

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Thông báo"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="font-semibold text-sm">Thông báo</span>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleMarkAllRead}
                disabled={isPending}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Đọc tất cả
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={handleClearAll}
                disabled={isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="max-h-[380px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <BellOff className="h-8 w-8 opacity-30" />
              <p className="text-sm">Không có thông báo nào</p>
            </div>
          ) : (
            notifications.map((notif, idx) => {
              const { icon, color } = config(notif.type)
              return (
                <div key={notif.id}>
                  {idx > 0 && <DropdownMenuSeparator className="my-0" />}
                  <div
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-accent transition-colors group relative",
                      !notif.is_read && "bg-primary/5"
                    )}
                    onClick={() => handleClickNotif(notif)}
                  >
                    {/* Unread dot */}
                    {!notif.is_read && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}

                    {/* Icon */}
                    <span className={cn("mt-0.5 shrink-0", color)}>{icon}</span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm leading-snug", !notif.is_read && "font-medium")}>
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.body}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {relativeTime(notif.created_at)}
                      </p>
                    </div>

                    {/* Delete button */}
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(notif.id, !notif.is_read)
                      }}
                      aria-label="Xóa thông báo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
