import Link from "next/link"
import { Layers, Settings } from "lucide-react"
import { createServerClient } from "@/lib/supabase/server"
import { LogoutButton } from "@/components/auth/logout-button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { AvatarUpload } from "@/components/auth/avatar-upload"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { getNotifications, getUnreadCount } from "@/lib/actions/notifications"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export async function NavBar() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const username = user?.user_metadata?.username as string | undefined
  const email = user?.email ?? ""
  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : email.slice(0, 2).toUpperCase()

  // Fetch avatar_url + notifications song song
  const [profileResult, notifications, unreadCount] = await Promise.all([
    user
      ? supabase.from("profiles").select("avatar_url").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
    user ? getNotifications(30) : Promise.resolve([]),
    user ? getUnreadCount() : Promise.resolve(0),
  ])

  const profile = (profileResult as { data: { avatar_url: string | null } | null }).data

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6">
      <Link href="/boards" className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity">
        <Layers className="h-5 w-5 text-primary" />
        <span>KanbanFlow</span>
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationBell notifications={notifications} unreadCount={unreadCount} />
        {/* Avatar với dropdown upload riêng */}
        <AvatarUpload
          initials={initials}
          avatarUrl={profile?.avatar_url}
          userId={user?.id ?? ""}
        />
        {/* Tên + menu tài khoản */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring max-w-[160px]"
          >
            <span className="truncate hidden sm:block">
              {username ?? email}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5">
              <p className="text-sm font-semibold truncate">{username ?? email}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/profile" className="flex items-center gap-2 cursor-pointer w-full">
                <Settings className="h-4 w-4" />
                Cài đặt tài khoản
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogoutButton asMenuItem />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
