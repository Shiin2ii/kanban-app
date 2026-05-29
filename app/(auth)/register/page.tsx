import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthForm } from "@/components/auth/auth-form"

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Tạo tài khoản</CardTitle>
        <CardDescription>Đăng ký để bắt đầu quản lý công việc với Kanban</CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm mode="register" />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link href="/login" className="underline underline-offset-4 hover:text-primary">
            Đăng nhập
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
