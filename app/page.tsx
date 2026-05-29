import Link from "next/link"
import { Layers, LayoutGrid, Zap, Shield, ArrowRight, GripVertical, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function LandingPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect("/boards")

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Layers className="h-5 w-5 text-primary" />
          <span>KanbanFlow</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
            Đăng nhập
          </Button>
          <Button nativeButton={false} render={<Link href="/register" />}>
            Bắt đầu miễn phí
          </Button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-24 bg-gradient-to-b from-primary/8 via-primary/3 to-background relative overflow-hidden">
        {/* background blur blobs */}
        <div className="absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute top-16 right-1/4 h-56 w-56 rounded-full bg-violet-500/8 blur-3xl pointer-events-none" />

        <div className="relative inline-flex items-center gap-2 rounded-full border bg-background/80 px-3.5 py-1 text-xs font-medium text-muted-foreground mb-6 shadow-sm">
          <Zap className="h-3 w-3 text-primary" />
          Cập nhật realtime · Drag &amp; drop
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-[1.1] text-foreground">
          Quản lý công việc{" "}
          <span className="text-primary">thông minh hơn</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed">
          Tổ chức tasks, theo dõi tiến độ và cộng tác thời gian thực. 
          Giao diện trực quan theo phong cách Kanban — đơn giản mà hiệu quả.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Button size="lg" nativeButton={false} render={<Link href="/register" />}>
            Dùng thử miễn phí <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/login" />}>
            Đăng nhập
          </Button>
        </div>

        {/* ── Kanban board mockup ── */}
        <div className="mt-16 w-full max-w-4xl rounded-xl border bg-muted/40 shadow-2xl overflow-hidden">
          {/* mock toolbar */}
          <div className="h-9 bg-background/90 border-b flex items-center gap-1.5 px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            <span className="ml-3 text-xs text-muted-foreground font-medium">KanbanFlow — My Project</span>
          </div>
          {/* mock board */}
          <div className="flex gap-3 p-4 overflow-x-auto">
            {mockColumns.map((col) => (
              <div key={col.title} className="w-52 shrink-0 flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs font-semibold text-foreground/80">{col.title}</span>
                  <span className="ml-auto text-[10px] rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground font-medium">{col.cards.length}</span>
                </div>
                {col.cards.map((card) => (
                  <div key={card} className="rounded-lg border bg-background px-3 py-2.5 text-xs text-foreground shadow-sm flex items-start gap-2">
                    <GripVertical className="h-3 w-3 text-muted-foreground/50 mt-0.5 shrink-0" />
                    <span className="leading-snug">{card}</span>
                  </div>
                ))}
                <div className="rounded-lg border border-dashed border-muted-foreground/20 px-3 py-2 text-xs text-muted-foreground/50 text-center">
                  + Thêm task
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-4 border-t bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Tại sao dùng KanbanFlow?</h2>
            <p className="mt-2 text-muted-foreground text-sm sm:text-base">Mọi thứ bạn cần để quản lý dự án hiệu quả</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="rounded-xl border bg-background p-6 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4 bg-primary/5 border-t">
        <div className="max-w-xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Layers className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Sẵn sàng bắt đầu chưa?
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Tạo tài khoản ngay hôm nay — hoàn toàn miễn phí. Không cần thẻ tín dụng.
          </p>
          <ul className="flex flex-col sm:flex-row gap-3 text-sm text-muted-foreground">
            {["Đăng ký miễn phí", "Không giới hạn boards", "Realtime sync"].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <Button size="lg" nativeButton={false} render={<Link href="/register" />}>
            Tạo tài khoản ngay <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-6 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium">
          <Layers className="h-3.5 w-3.5 text-primary" />
          KanbanFlow
        </div>
        <p>© 2026 · Đồ án cuối kỳ · CTK46-PM</p>
        <div className="flex gap-4">
          <Link href="/login" className="hover:text-foreground transition-colors">Đăng nhập</Link>
          <Link href="/register" className="hover:text-foreground transition-colors">Đăng ký</Link>
        </div>
      </footer>
    </div>
  )
}

const mockColumns = [
  {
    title: "Cần làm",
    cards: ["Thiết kế giao diện dashboard", "Viết unit tests", "Cập nhật README"],
  },
  {
    title: "Đang làm",
    cards: ["Tích hợp Supabase Auth", "Implement drag & drop"],
  },
  {
    title: "Hoàn thành",
    cards: ["Cài đặt dự án Next.JS", "Thiết kế DB schema", "Docker setup"],
  },
]

const features = [
  {
    icon: LayoutGrid,
    title: "Kanban board trực quan",
    desc: "Kéo thả tasks giữa các cột một cách mượt mà. Tổ chức công việc theo cách bạn muốn.",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: Zap,
    title: "Realtime collaboration",
    desc: "Mọi thay đổi được đồng bộ ngay lập tức. Cộng tác với team mà không cần refresh trang.",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: Shield,
    title: "Bảo mật với RLS",
    desc: "Dữ liệu được bảo vệ bằng Row Level Security. Chỉ bạn mới thấy và quản lý boards của mình.",
    color: "bg-emerald-500/10 text-emerald-600",
  },
]
