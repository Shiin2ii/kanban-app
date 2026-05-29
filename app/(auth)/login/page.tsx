import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthForm } from "@/components/auth/auth-form"

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Đăng nhập</CardTitle>
        <CardDescription>Nhập thông tin để truy cập bảng Kanban của bạn</CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm mode="login" />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="underline underline-offset-4 hover:text-primary">
            Đăng ký
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
