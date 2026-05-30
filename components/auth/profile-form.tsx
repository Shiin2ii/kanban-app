"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { User, Lock, Save, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AvatarUpload } from "@/components/auth/avatar-upload"
import { updateUsername, updatePassword } from "@/lib/actions/profile"
import { toast } from "sonner"

type ProfileFormProps = {
  userId: string
  username: string
  email: string
  avatarUrl: string | null
  initials: string
}

export function ProfileForm({ userId, username, email, avatarUrl, initials }: ProfileFormProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  // Username section
  const [usernameValue, setUsernameValue] = useState(username)
  const [usernamePending, setUsernamePending] = useState(false)

  // Password section
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordPending, setPasswordPending] = useState(false)

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (usernameValue.trim() === username) {
      toast.info("Tên hiển thị chưa thay đổi")
      return
    }
    setUsernamePending(true)
    const result = await updateUsername(usernameValue)
    setUsernamePending(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Đã cập nhật tên hiển thị!")
      startTransition(() => router.refresh())
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPassword) { toast.error("Nhập mật khẩu hiện tại"); return }
    if (!newPassword) { toast.error("Nhập mật khẩu mới"); return }
    if (newPassword !== confirmPassword) { toast.error("Mật khẩu xác nhận không khớp"); return }
    setPasswordPending(true)
    const result = await updatePassword(currentPassword, newPassword)
    setPasswordPending(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Đã cập nhật mật khẩu!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }
  }

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Ảnh đại diện
          </CardTitle>
          <CardDescription>Click vào ảnh để thay đổi hoặc xóa ảnh đại diện</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <AvatarUpload initials={initials} avatarUrl={avatarUrl} userId={userId} />
          <div className="text-sm text-muted-foreground">
            <p>Tối đa 256×256px, định dạng JPEG/PNG</p>
            <p>Ảnh sẽ được tự động nén về 256px</p>
          </div>
        </CardContent>
      </Card>

      {/* Username */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Thông tin cá nhân
          </CardTitle>
          <CardDescription>Cập nhật tên hiển thị của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} disabled className="bg-muted text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Tên hiển thị</Label>
              <Input
                id="username"
                value={usernameValue}
                onChange={(e) => setUsernameValue(e.target.value)}
                placeholder="Nhập tên hiển thị"
                maxLength={50}
                required
              />
            </div>
            <Button type="submit" disabled={usernamePending} className="gap-2">
              {usernamePending ? (
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lưu thay đổi
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Đổi mật khẩu
          </CardTitle>
          <CardDescription>Đặt mật khẩu mới cho tài khoản của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowCurrent((v) => !v)}
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowNew((v) => !v)}
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && newPassword && (
                <p className={`text-xs flex items-center gap-1 ${newPassword === confirmPassword ? "text-emerald-600" : "text-destructive"}`}>
                  <CheckCircle2 className="h-3 w-3" />
                  {newPassword === confirmPassword ? "Mật khẩu khớp" : "Mật khẩu không khớp"}
                </p>
              )}
            </div>
            <Button type="submit" disabled={passwordPending} className="gap-2">
              {passwordPending ? (
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Cập nhật mật khẩu
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
