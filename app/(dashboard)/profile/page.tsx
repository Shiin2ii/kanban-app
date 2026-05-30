import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { ProfileForm } from "@/components/auth/profile-form"

export default async function ProfilePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single()

  const username = (profile?.username ?? user.user_metadata?.username ?? "") as string
  const email = user.email ?? ""
  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : email.slice(0, 2).toUpperCase()

  return (
    <div className="container mx-auto px-6 py-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/boards"
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Quay lại"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="h-4 w-px bg-border" />
        <div>
          <h1 className="text-2xl font-bold">Cài đặt tài khoản</h1>
          <p className="text-sm text-muted-foreground">Quản lý thông tin cá nhân và bảo mật</p>
        </div>
      </div>

      <ProfileForm
        userId={user.id}
        username={username}
        email={email}
        avatarUrl={profile?.avatar_url ?? null}
        initials={initials}
      />
    </div>
  )
}
