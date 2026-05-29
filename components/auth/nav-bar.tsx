import Link from "next/link"
import { Layers } from "lucide-react"
import { createServerClient } from "@/lib/supabase/server"
import { LogoutButton } from "@/components/auth/logout-button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export async function NavBar() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const username = user?.user_metadata?.username as string | undefined
  const email = user?.email ?? ""
  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : email.slice(0, 2).toUpperCase()

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6">
      <Link href="/boards" className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity">
        <Layers className="h-5 w-5 text-primary" />
        <span>KanbanFlow</span>
      </Link>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:block">
            {username ?? email}
          </span>
        </div>
        <LogoutButton />
      </div>
    </header>
  )
}
