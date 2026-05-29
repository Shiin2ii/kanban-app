# BÁO CÁO ĐỒ ÁN CUỐI KỲ
## Môn học: Các Công Nghệ Mới Trong Phát Triển Phần Mềm

---

**Họ và tên:** Ngô Hồ Tấn Toàn  
**Mã sinh viên:** 2251120147  
**Lớp:** CTK46-PM — Công nghệ thông tin, Khoá 46, Chuyên ngành Kỹ thuật phần mềm  
**Ngày nộp:** 30/05/2026  
**GitHub Repository:** https://github.com/Shiin2ii/kanban-app  
**Demo URL:** https://ngohotantoan.id.vn  

---

## MỤC LỤC

1. Giới thiệu
2. Công nghệ sử dụng
3. Kiến trúc hệ thống
4. Phân tích chức năng
5. AI trong phát triển
6. Docker & Deployment
7. Kết luận & Hạn chế
8. Tài liệu tham khảo
9. Phụ lục — Danh sách Prompts AI

---

## 1. GIỚI THIỆU

### 1.1. Bối cảnh và động lực

Trong môi trường làm việc hiện đại, việc quản lý công việc hiệu quả là yếu tố then chốt quyết định năng suất của cá nhân và nhóm. Phương pháp Kanban — xuất phát từ Toyota Production System vào thập niên 1950 — đã chứng minh được hiệu quả trong việc trực quan hóa luồng công việc, giới hạn công việc đang tiến hành và tối ưu hóa quy trình.

Các công cụ Kanban hiện tại như Trello, Jira, hay Asana đều là các nền tảng SaaS với nhiều tính năng phức tạp, thường quá nặng nề cho các nhóm nhỏ hoặc cá nhân. Đề tài này hướng đến xây dựng một ứng dụng Kanban tự host (self-hosted), nhẹ nhàng, hiệu quả, có thể triển khai trên VPS riêng với chi phí thấp.

### 1.2. Mô tả đề tài

**KanbanFlow** là ứng dụng web quản lý công việc theo phương pháp Kanban, được xây dựng bằng Next.JS 15 (App Router), Supabase và TypeScript. Ứng dụng cho phép người dùng:

- Tạo nhiều board Kanban riêng biệt cho từng dự án
- Tổ chức công việc theo cột (To Do, In Progress, Done, ...)
- Kéo thả task giữa và trong các cột
- Đặt deadline, mức độ ưu tiên và mô tả cho từng task
- Cộng tác theo thời gian thực nhờ Supabase Realtime

### 1.3. Mục tiêu

- Xây dựng ứng dụng full-stack hoàn chỉnh với Next.JS App Router
- Tích hợp Supabase cho xác thực, database, và realtime
- Containerize ứng dụng bằng Docker multi-stage build
- Triển khai lên VPS với domain và SSL
- Áp dụng TypeScript strict mode để đảm bảo type safety
- Sử dụng AI tool (GitHub Copilot) trong quá trình phát triển

---

## 2. CÔNG NGHỆ SỬ DỤNG

### 2.1. Next.JS 15 (App Router)

**Phiên bản:** 16.2.6  
**Vai trò:** Framework frontend và backend chính của ứng dụng

Next.JS được chọn vì khả năng kết hợp Server Components và Client Components trong cùng một framework, cho phép tối ưu hóa hiệu suất một cách linh hoạt. Với App Router (thư mục `app/`), Next.JS 15 cung cấp:

- **Server Components:** Fetch dữ liệu trực tiếp trên server, giảm JavaScript bundle size gửi về client. Tất cả các trang (`page.tsx`) đều là Server Components mặc định.
- **Client Components:** Chỉ dùng khi cần tương tác, hooks, hoặc browser APIs (thêm `"use client"` directive). Ví dụ: `KanbanBoard`, `TaskCard`, `BoardTitleEditor`.
- **Server Actions:** Thay thế hoàn toàn API routes cho các mutation (tạo/sửa/xóa dữ liệu). Tất cả mutations được đặt trong thư mục `lib/actions/`.
- **Turbopack:** Dev server nhanh hơn với hot reload gần như tức thì.
- **`output: "standalone"`:** Tạo bundle tối giản cho Docker, chỉ bao gồm các file cần thiết.

```
Cấu trúc routing (App Router):
app/
  (auth)/
    login/page.tsx       ← Trang đăng nhập (public)
    register/page.tsx    ← Trang đăng ký (public)
  (dashboard)/
    boards/
      page.tsx           ← Danh sách boards (protected)
      [boardId]/
        page.tsx         ← Chi tiết board (protected)
  auth/callback/         ← Supabase Auth callback
```

### 2.2. TypeScript

**Phiên bản:** 5.x (strict mode)  
**Vai trò:** Ngôn ngữ lập trình chính, đảm bảo type safety

TypeScript strict mode được bật, bao gồm: `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`. Tất cả kiểu dữ liệu đều được khai báo rõ ràng.

**Các pattern quan trọng:**
- `ActionResult<T>` — kiểu trả về chuẩn cho tất cả Server Actions:
  ```typescript
  type ActionResult<T> = {
    data: T | null
    error: string | null
  }
  ```
- `Database` type được auto-generate từ Supabase schema, đảm bảo các query luôn type-safe
- `BoardWithColumns`, `ColumnWithTasks` — extended types để join dữ liệu
- `BoardStats` — computed type cho thống kê boards

### 2.3. Supabase

**Phiên bản:** @supabase/supabase-js 2.106.2, @supabase/ssr 0.10.3  
**Vai trò:** Backend-as-a-Service — Auth, Database, Realtime, Storage

Supabase cung cấp đầy đủ backend cho ứng dụng:

**2.3.1. Authentication**
- Email/password authentication qua Supabase Auth
- Session management qua HTTP-only cookies (`@supabase/ssr`)
- Server-side auth check trong middleware và Server Components
- Trigger tự động tạo profile khi user đăng ký

**2.3.2. PostgreSQL Database**
- 5 bảng chính: `profiles`, `boards`, `columns`, `tasks`, `task_attachments`
- Row Level Security (RLS) bảo vệ tất cả dữ liệu
- Quan hệ foreign key đầy đủ

**2.3.3. Realtime**
- Subscribe vào Postgres Changes để cập nhật board theo thời gian thực
- Khi một tab thêm/sửa/xóa task, tất cả các tab khác tự động refresh

**2.3.4. Storage**
- Bucket `avatars`: lưu trữ ảnh đại diện người dùng
- Upload từ client với nén ảnh phía trình duyệt (Canvas API) trước khi gửi lên
- Ảnh được nén về tối đa 256×256px, định dạng JPEG quality 0.85
- RLS policies bảo vệ: chỉ user sở hữu mới upload/xóa được file của mình
- URL public để hiển thị avatar trên giao diện

**Hai loại Supabase client:**
```typescript
// Server (Server Components, Server Actions, Middleware)
import { createServerClient } from "@/lib/supabase/server"

// Browser (Client Components)
import { createBrowserClient } from "@/lib/supabase/client"
```

### 2.4. Tailwind CSS v4 + shadcn/ui

**Vai trò:** Styling và UI components

Tailwind CSS v4 với utility-first approach cho phép styling nhanh chóng mà không cần viết CSS riêng. shadcn/ui cung cấp các component có sẵn (Button, Dialog, Input, Badge, Card, ...) với design system nhất quán, hỗ trợ dark mode tích hợp.

**Đặc điểm:**
- Responsive design: mobile → tablet → desktop
- Dark mode support thông qua `next-themes`
- `class-variance-authority` cho variant-based components

### 2.5. @dnd-kit

**Phiên bản:** @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0  
**Vai trò:** Drag and drop

`@dnd-kit` là thư viện DnD hiệu suất cao, hỗ trợ cả pointer và touch events. Được dùng để:
- Kéo thả task giữa các cột
- Sắp xếp thứ tự task trong cùng một cột
- Kéo thả để sắp xếp lại thứ tự cột

### 2.6. Docker

**Vai trò:** Containerization

Multi-stage Dockerfile được sử dụng để:
1. **Stage deps:** Cài đặt dependencies
2. **Stage builder:** Build Next.JS production bundle
3. **Stage runner:** Image production tối giản, chạy với non-root user

Docker Compose quản lý container với `restart: unless-stopped`.

### 2.7. Git/GitHub

**Vai trò:** Version control, source code hosting

Repository: https://github.com/Shiin2ii/kanban-app  
Áp dụng Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`

---

## 3. KIẾN TRÚC HỆ THỐNG

### 3.1. Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                     │
│  Client Components (React) + Supabase Realtime          │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│              NGINX (Reverse Proxy + SSL)                 │
│              ngohotantoan.id.vn                         │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP :3000
┌──────────────────────▼──────────────────────────────────┐
│            DOCKER CONTAINER (Next.JS Server)             │
│                                                          │
│  ┌─────────────────┐    ┌─────────────────────────────┐  │
│  │ Server Components│    │    Server Actions           │  │
│  │ (Data Fetching)  │    │ (Mutations - lib/actions/)  │  │
│  └────────┬────────┘    └──────────────┬──────────────┘  │
└───────────┼──────────────────────────────────────────────┘
            │ HTTPS API calls
┌───────────▼──────────────────────────────────────────────┐
│                    SUPABASE (Cloud)                       │
│                                                          │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────┐  │
│  │   Auth   │  │ PostgreSQL│  │ Realtime │  │Storage │  │
│  └──────────┘  └───────────┘  └──────────┘  └────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 3.2. Cấu trúc thư mục

```
newtech_cuoiky/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx        ← Trang đăng nhập
│   │   └── register/page.tsx     ← Trang đăng ký
│   ├── (dashboard)/
│   │   └── boards/
│   │       ├── page.tsx          ← Danh sách boards + thống kê
│   │       └── [boardId]/
│   │           └── page.tsx      ← Chi tiết board Kanban
│   ├── auth/callback/route.ts    ← Supabase Auth callback
│   └── layout.tsx                ← Root layout
├── components/
│   ├── boards/
│   │   ├── board-list.tsx        ← Grid hiển thị boards
│   │   ├── board-title-editor.tsx← Inline edit tên board
│   │   ├── kanban-board.tsx      ← Main board component
│   │   └── kanban-column.tsx     ← Column component
│   ├── tasks/
│   │   └── task-card.tsx         ← Task card component
│   └── ui/                       ← shadcn/ui primitives
├── lib/
│   ├── actions/
│   │   ├── auth.ts               ← login, register, logout
│   │   ├── boards.ts             ← CRUD boards + stats
│   │   ├── columns.ts            ← CRUD columns + reorder
│   │   └── tasks.ts              ← CRUD tasks + move + toggle
│   └── supabase/
│       ├── client.ts             ← Browser client
│       └── server.ts             ← Server client
├── types/
│   ├── database.types.ts         ← Auto-generated from Supabase
│   └── index.ts                  ← App types
├── Dockerfile                    ← Multi-stage build
├── docker-compose.yml            ← Container orchestration
└── next.config.ts                ← output: standalone
```

### 3.3. Thiết kế database (Schema)

**Bảng `profiles`**
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid (PK, FK → auth.users) | ID người dùng |
| username | text | Tên hiển thị |
| avatar_url | text | URL ảnh đại diện |
| updated_at | timestamptz | Cập nhật lần cuối |

**Bảng `boards`**
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid (PK) | ID board |
| user_id | uuid (FK → profiles) | Chủ sở hữu |
| title | text | Tên board |
| created_at | timestamptz | Ngày tạo |

**Bảng `columns`**
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid (PK) | ID cột |
| board_id | uuid (FK → boards) | Thuộc board nào |
| title | text | Tên cột |
| position | integer | Thứ tự hiển thị |
| created_at | timestamptz | Ngày tạo |

**Bảng `tasks`**
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid (PK) | ID task |
| column_id | uuid (FK → columns) | Thuộc cột nào |
| title | text | Tiêu đề task |
| description | text | Mô tả chi tiết |
| priority | text | Mức ưu tiên: high/medium/low |
| due_date | date | Deadline |
| is_completed | boolean | Trạng thái hoàn thành |
| position | integer | Thứ tự trong cột |
| created_at | timestamptz | Ngày tạo |

**Bảng `task_attachments`**
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid (PK) | ID đính kèm |
| task_id | uuid (FK → tasks) | Thuộc task nào |
| file_url | text | URL file trên Supabase Storage |
| file_name | text | Tên file gốc |
| created_at | timestamptz | Ngày tạo |

**ERD (Entity Relationship Diagram):**
```
profiles (1) ──── (N) boards (1) ──── (N) columns (1) ──── (N) tasks (1) ──── (N) task_attachments
```

### 3.4. Row Level Security (RLS)

Tất cả 5 bảng đều bật RLS. Chính sách bảo mật:

```sql
-- Boards: chỉ xem/sửa boards của chính mình
CREATE POLICY "Users can manage own boards"
ON boards FOR ALL
USING (auth.uid() = user_id);

-- Columns: chỉ thao tác columns thuộc boards của mình
CREATE POLICY "Users can manage columns of own boards"
ON columns FOR ALL
USING (
  board_id IN (
    SELECT id FROM boards WHERE user_id = auth.uid()
  )
);

-- Tasks: tương tự qua columns → boards
CREATE POLICY "Users can manage tasks of own boards"
ON tasks FOR ALL
USING (
  column_id IN (
    SELECT c.id FROM columns c
    JOIN boards b ON c.board_id = b.id
    WHERE b.user_id = auth.uid()
  )
);
```

Nhờ RLS, dù người dùng gọi API trực tiếp, họ vẫn không thể truy cập dữ liệu của người khác. Server Actions chỉ là lớp convenience — bảo mật thực sự nằm ở database level.

---

## 4. PHÂN TÍCH CHỨC NĂNG

### 4.1. Authentication

**Đăng ký tài khoản:**
- Người dùng nhập username, email, password
- Server Action `register()` gọi `supabase.auth.signUp()` với metadata username
- Supabase trigger tự động tạo record trong bảng `profiles`
- Redirect về `/boards` sau khi đăng ký thành công

**Đăng nhập:**
- Server Action `login()` gọi `supabase.auth.signInWithPassword()`
- Session được lưu trong HTTP-only cookie (bảo mật, không accessible qua JS)
- Middleware `proxy.ts` kiểm tra session, redirect về `/login` nếu chưa đăng nhập

**Đăng xuất:**
- Server Action `logout()` gọi `supabase.auth.signOut()`
- Xóa cookie session, redirect về `/login`

### 4.2. Quản lý Board

**Tạo board:**
- Form tạo board với validation (tên không được để trống)
- Server Action `createBoard()` insert vào bảng `boards` với `user_id` từ session

**Danh sách boards với thống kê:**
- Server Component fetch tất cả boards kèm số liệu thống kê
- Hiển thị: tổng task, task hoàn thành, task đang làm, task quá hạn
- Progress bar trực quan cho từng board

**Inline edit tên board:**
- Component `BoardTitleEditor` — click vào tên để chỉnh sửa tại chỗ
- Lưu khi nhấn Enter hoặc blur, hủy khi nhấn Escape

**Xóa board:**
- Confirmation dialog trước khi xóa
- Cascade delete: xóa board → xóa columns → xóa tasks (PostgreSQL foreign key)

### 4.3. Quản lý Cột (Column)

**Tạo cột:**
- Nhập tên cột trong inline form ở cuối board
- Hỗ trợ phím tắt Enter để tạo, Escape để hủy

**Đổi tên cột:**
- Click vào tên cột để chỉnh sửa inline

**Xóa cột:**
- Confirmation, cascade xóa tất cả tasks trong cột

**Màu sắc cột:**
- Color picker ngay trên cột, lưu vào localStorage

**Sắp xếp cột:**
- Kéo thả bằng @dnd-kit để đổi thứ tự cột
- Lưu `position` vào database sau khi kéo thả

**Gấp/mở cột:**
- Toggle ẩn/hiện tasks trong cột để tiết kiệm không gian
- Nút "Gấp tất cả / Mở tất cả" trên toolbar

**Xóa completed tasks:**
- Nút xóa hàng loạt tasks đã hoàn thành trong cột

### 4.4. Quản lý Task

**Tạo task:**
- Form inline trong cột với đầy đủ fields: tiêu đề, mô tả, ưu tiên, deadline
- Validation: tiêu đề không được để trống

**Xem và chỉnh sửa task:**
- Click vào card để mở dialog chi tiết
- Chỉnh sửa tất cả thông tin trong dialog

**Hoàn thành task:**
- Click vào checkbox tròn trên card để toggle hoàn thành
- Hiệu ứng gạch ngang tiêu đề khi hoàn thành

**Xóa task:**
- Từ dialog chi tiết hoặc context menu

**Nhân bản task:**
- Tạo bản copy của task với tên "(Copy) [tên gốc]"

**Kéo thả task:**
- Trong cùng cột: sắp xếp lại thứ tự
- Giữa các cột: chuyển task sang cột khác
- Optimistic update: UI cập nhật ngay, không cần chờ server

**Priority badge:**
- Click trực tiếp lên badge ưu tiên để cycle: Cao → Vừa → Thấp → Cao

**Smart date labels:**
- "Hôm nay" (màu vàng amber) cho deadline hôm nay
- "Ngày mai" (màu xanh) cho deadline ngày mai
- "X ngày" cho các deadline trong tương lai
- "Xn quá hạn" (màu đỏ) + ring đỏ trên card khi quá hạn

### 4.5. Context Menu (Right-click)

Click chuột phải trên task card mở menu ngữ cảnh với các tùy chọn:
- Toggle hoàn thành / bỏ hoàn thành
- Chỉnh sửa
- Nhân bản
- **Chuyển sang** — submenu liệt kê tất cả cột khác trong board
- Đổi ưu tiên (với indicator cột nào đang được chọn)
- Xóa task

Menu được render bằng `createPortal` vào `document.body` để tránh bị clip bởi overflow của parent containers.

### 4.6. Tìm kiếm và Lọc

**Tìm kiếm:**
- Tìm kiếm real-time theo tên task (không cần nhấn Enter)
- Phím tắt `/` để focus vào ô tìm kiếm từ bất kỳ đâu
- **Search highlight:** text khớp được bôi vàng trực tiếp trên card

**Lọc theo ưu tiên/trạng thái:**
- Filter buttons: Tất cả · Cao · Vừa · Thấp · Hoàn thành · Hôm nay · Quá hạn
- Lọc nhanh tasks theo từng tiêu chí

**Ẩn tasks đã hoàn thành:**
- Toggle ẩn/hiện tất cả tasks đã đánh dấu xong

### 4.7. Thống kê và Export

**Stats bar:**
- Tổng số tasks, số đã hoàn thành (%), tasks ưu tiên cao, tasks quá hạn

**Export Markdown:**
- Xuất toàn bộ nội dung board thành Markdown
- Copy vào clipboard, có thể dán vào Notion/GitHub/bất kỳ đâu

**Board overview (trang boards):**
- Greeting cá nhân hóa "Xin chào, [username]!"
- 4 thẻ thống kê: Tổng boards, Đã hoàn thành, Đang làm, Quá hạn
- Progress bar và số liệu cho từng board

### 4.8. Realtime Synchronization

Ứng dụng sử dụng hai cơ chế Realtime kết hợp để đảm bảo đồng bộ dữ liệu:

**Cơ chế 1 — Supabase Broadcast (chính):**
Sau mỗi mutation (kéo thả, tạo/xóa task, đổi tên cột...), tab thực hiện thao tác gửi ngay một broadcast message lên channel. Các tab khác đang mở cùng board nhận được và gọi `router.refresh()`.

```typescript
// kanban-board.tsx — subscription với broadcast
const channel = supabase
  .channel(`board-${board.id}`)
  .on("broadcast", { event: "board-update" }, () => {
    startTransition(() => router.refresh())
  })
  .on("postgres_changes",
    { event: "*", schema: "public", table: "columns",
      filter: `board_id=eq.${board.id}` },
    () => startTransition(() => router.refresh())
  )
  .subscribe((status) => {
    if (status === "SUBSCRIBED")
      toast.success("Realtime connected", { duration: 2000 })
  })

// Sau mỗi mutation:
channelRef.current?.send({
  type: "broadcast",
  event: "board-update",
  payload: {}
})
```

**Cơ chế 2 — Postgres Changes (backup):**
Lắng nghe `postgres_changes` trên bảng `columns` làm backup khi tab gặp lỗi broadcast hoặc thay đổi đến từ bên ngoài (ví dụ: seed data).

**Lý do dùng Broadcast thay vì chỉ dùng Postgres Changes:**
Bảng `tasks` có RLS policy phức tạp (join qua `columns → boards`), Supabase Realtime không thể evaluate được khi không có `board_id` trực tiếp trên bảng tasks. Broadcast không bị ràng buộc RLS nên hoạt động ổn định hơn.

### 4.9. Upload Avatar

Tính năng cho phép người dùng đổi ảnh đại diện trực tiếp từ navbar.

**Luồng xử lý:**
1. Click vào avatar → dropdown menu → chọn "Đổi ảnh đại diện"
2. File picker mở → người dùng chọn ảnh
3. **Nén ảnh phía client** bằng Canvas API (không cần thư viện ngoài):
   - Resize về tối đa 256×256px giữ tỉ lệ
   - Chuyển sang JPEG với quality 0.85
4. Upload lên Supabase Storage bucket `avatars` tại path `{userId}/avatar`
5. Server Action `updateAvatarUrl()` cập nhật `profiles.avatar_url`
6. `router.refresh()` để NavBar (Server Component) fetch URL mới

```typescript
// Nén ảnh bằng Canvas API
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > 256 || height > 256) {
        if (width > height) { height = Math.round(height * 256 / width); width = 256 }
        else { width = Math.round(width * 256 / height); height = 256 }
      }
      const canvas = document.createElement("canvas")
      canvas.width = width; canvas.height = height
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => resolve(blob!), "image/jpeg", 0.85)
    }
    img.src = URL.createObjectURL(file)
  })
}
```

**Instant preview:** Ảnh hiển thị ngay trước khi upload hoàn tất (dùng Object URL làm preview tạm).

**Xóa avatar:** Xóa file khỏi Storage và clear `avatar_url` trong database.

### 4.10. Keyboard Shortcuts

| Phím | Chức năng |
|------|-----------|
| `/` | Focus vào ô tìm kiếm |
| `?` | Mở/đóng bảng phím tắt |
| `Esc` | Đóng modal / Bỏ chọn |
| Chuột phải | Mở context menu task |
| Click ưu tiên | Đổi priority nhanh |
| Click cột | Gấp / mở rộng cột |

---

## 5. AI TRONG PHÁT TRIỂN

### 5.1. Công cụ AI sử dụng

**GitHub Copilot** (tích hợp trong VS Code) được sử dụng xuyên suốt quá trình phát triển với hai chế độ:
- **Chat mode:** Đặt câu hỏi, yêu cầu giải thích, debug
- **Agent mode:** Thực hiện các task phức tạp tự động (đọc file, viết code, chạy lệnh)

### 5.2. Cách GitHub Copilot hỗ trợ

**a) Thiết kế kiến trúc và code structure**
- Gợi ý cấu trúc thư mục cho Next.JS App Router
- Hỗ trợ thiết kế các kiểu TypeScript (`ActionResult<T>`, extended types)
- Giải thích sự khác biệt giữa Server Component và Client Component

**b) Implement tính năng phức tạp**
- Context menu với `createPortal` (thay thế Base UI bị lỗi)
- Drag and drop với @dnd-kit (bao gồm fix bug within-column reorder)
- Supabase Realtime subscription

**c) Debug và fix lỗi**
- Fix TypeScript errors trong quá trình build
- Fix lỗi `Select.onValueChange` không chấp nhận `null`
- Fix lỗi Docker build trên VPS 512MB RAM
- Fix lỗi CRLF line endings trong Dockerfile

**d) Deployment**
- Hướng dẫn từng bước setup VPS DigitalOcean
- Cấu hình Nginx reverse proxy
- Cài đặt SSL certificate với Let's Encrypt/Certbot
- Debug Docker build failures

### 5.3. Đánh giá hiệu quả

GitHub Copilot giúp rút ngắn đáng kể thời gian phát triển, đặc biệt trong:
- Tạo boilerplate code (Server Actions, Supabase queries)
- Debug các lỗi TypeScript phức tạp
- Giải quyết các vấn đề về môi trường deploy

Tuy nhiên, người lập trình vẫn cần hiểu rõ logic để:
- Kiểm tra tính đúng đắn của code được generate
- Điều chỉnh cho phù hợp với context cụ thể
- Xử lý các edge cases đặc thù

---

## 6. DOCKER & DEPLOYMENT

### 6.1. Dockerfile (Multi-stage Build)

```dockerfile
# ── Stage 1: Install dependencies ──────────────────────
FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@11.4.0 && pnpm install --frozen-lockfile --ignore-scripts

# ── Stage 2: Build ──────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm install -g pnpm@11.4.0 && pnpm build

# ── Stage 3: Production runner ──────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user cho bảo mật
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
```

**Lý do dùng multi-stage build:**
- Image production chỉ chứa runtime, không có source code hay dev dependencies
- Image size giảm từ ~1.5GB (nếu single stage) xuống còn ~150MB
- Tăng bảo mật: không có build tools, npm, hay source code trong production

### 6.2. Docker Compose

```yaml
services:
  app:
    build:
      context: .
      args:
        NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    restart: unless-stopped
```

`restart: unless-stopped` đảm bảo container tự khởi động lại sau khi VPS reboot.

### 6.3. Quy trình Deploy

**Chiến lược deploy được áp dụng:** Build image local → Push lên Docker Hub → Pull về VPS

Lý do: VPS chỉ có 512MB RAM, không đủ để build Next.JS (cần ~800MB-1GB RAM). Giải pháp là build trên máy local (16GB RAM) rồi đẩy image đã build lên Docker Hub.

**Các bước thực hiện:**

**Bước 1 — Chuẩn bị VPS (DigitalOcean Singapore, $4/mo)**
```bash
# Thêm swap để tránh OOM
fallocate -l 2G /swapfile && chmod 600 /swapfile
mkswap /swapfile && swapon /swapfile

# Cài Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER && newgrp docker
```

**Bước 2 — Build và push image từ máy local**
```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  -t shiin2ii/kanban-app:latest .

docker push shiin2ii/kanban-app:latest
```

**Bước 3 — Pull và chạy trên VPS**
```bash
docker run -d \
  --name kanban-app \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  --restart unless-stopped \
  shiin2ii/kanban-app:latest
```

**Bước 4 — Cấu hình Nginx**
```nginx
server {
    listen 80;
    server_name ngohotantoan.id.vn www.ngohotantoan.id.vn;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Bước 5 — SSL với Let's Encrypt**
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d ngohotantoan.id.vn -d www.ngohotantoan.id.vn
```

Certbot tự động:
- Xin certificate từ Let's Encrypt (miễn phí, trusted CA)
- Cập nhật Nginx config để redirect HTTP → HTTPS
- Cài cron job để tự gia hạn certificate mỗi 90 ngày

### 6.4. Thông tin Production

| Thông tin | Giá trị |
|-----------|---------|
| VPS Provider | DigitalOcean |
| Region | Singapore (SGP1) |
| Spec | 1 vCPU, 512MB RAM, 10GB SSD |
| OS | Ubuntu 24.04 LTS |
| IP | 165.245.179.240 |
| Domain | ngohotantoan.id.vn |
| SSL | Let's Encrypt (valid 90 ngày, tự gia hạn) |
| Container | Docker 27.x |
| Image | shiin2ii/kanban-app:latest (Docker Hub) |

---

## 7. KẾT LUẬN & HẠN CHẾ

### 7.1. Kết quả đạt được

Đề tài đã xây dựng thành công ứng dụng Kanban Task Manager với đầy đủ các yêu cầu đặt ra:

**Về chức năng:**
- ✅ Authentication đầy đủ (đăng ký, đăng nhập, đăng xuất)
- ✅ CRUD đầy đủ cho boards, columns, tasks
- ✅ Drag and drop trực quan (task và column)
- ✅ Priority, deadline, mô tả cho task
- ✅ Realtime synchronization (Broadcast + Postgres Changes)
- ✅ Tìm kiếm và lọc nâng cao
- ✅ Context menu phong phú
- ✅ Keyboard shortcuts
- ✅ Export Markdown
- ✅ Thống kê tổng quan
- ✅ Upload và quản lý ảnh đại diện (Supabase Storage + Canvas compression)

**Về kỹ thuật:**
- ✅ Next.JS 15 App Router với Server/Client Components
- ✅ TypeScript strict mode không có `any`
- ✅ Supabase Auth + Database + Realtime
- ✅ RLS bảo vệ tất cả dữ liệu
- ✅ Docker multi-stage build
- ✅ Deploy VPS + Nginx + SSL
- ✅ GitHub repository với commit history
- ✅ AI tool (GitHub Copilot) có minh chứng

### 7.2. Hạn chế

1. **Chỉ có một người dùng per board:** Chưa có tính năng chia sẻ board hoặc cộng tác nhiều người trên cùng board.

2. **Chức năng file đính kèm cho task chưa có UI:** Schema `task_attachments` và Storage đã chuẩn bị, nhưng UI upload file đính kèm vào task chưa được implement (avatar upload đã hoàn thiện).

3. **Không có notifications:** Chưa có thông báo khi task sắp đến deadline hoặc khi được gán task.

4. **VPS giới hạn tài nguyên:** 512MB RAM đòi hỏi phải build image ở nơi khác, không thể tự build trực tiếp trên server.

5. **Chưa có mobile app:** Ứng dụng responsive trên mobile nhưng chưa tối ưu cho trải nghiệm touch trên điện thoại.

### 7.3. Hướng phát triển

- **Board sharing:** Mời thành viên vào board với các quyền khác nhau (viewer, editor)
- **Task assignee:** Gán task cho thành viên cụ thể
- **Subtasks/Checklist:** Danh sách công việc con trong task
- **Notifications:** Thông báo email/push khi deadline sắp đến
- **Calendar view:** Xem tasks theo lịch tháng
- **WIP limit:** Giới hạn số task trong mỗi cột (Kanban WIP limit)
- **CI/CD pipeline:** GitHub Actions để tự động build và deploy khi push code

---

## 8. TÀI LIỆU THAM KHẢO

1. Next.JS Documentation — App Router: https://nextjs.org/docs
2. Supabase Documentation: https://supabase.com/docs
3. Supabase Auth Helpers for Next.JS (@supabase/ssr): https://supabase.com/docs/guides/auth/server-side/nextjs
4. Supabase Realtime: https://supabase.com/docs/guides/realtime
5. @dnd-kit Documentation: https://docs.dndkit.com
6. shadcn/ui Documentation: https://ui.shadcn.com
7. Tailwind CSS v4 Documentation: https://tailwindcss.com/docs
8. TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/
9. Docker Multi-stage Builds: https://docs.docker.com/build/building/multi-stage/
10. Let's Encrypt Documentation: https://letsencrypt.org/docs/
11. Nginx Reverse Proxy Guide: https://nginx.org/en/docs/beginners_guide.html
12. DigitalOcean Droplet Documentation: https://docs.digitalocean.com/products/droplets/
13. Conventional Commits Specification: https://www.conventionalcommits.org/
14. Row Level Security in PostgreSQL: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
15. GitHub Copilot Documentation: https://docs.github.com/en/copilot

---

## 9. PHỤ LỤC — DANH SÁCH PROMPTS AI (GitHub Copilot)

Dưới đây là 10 prompts đầu tiên được gửi đến GitHub Copilot trong phiên làm việc ngày 29/05/2026 (trích xuất trực tiếp từ lịch sử chat, session ID: `9b185f52-22f6-4f6f-8e88-c84a239c668e`):

---

**Prompt 1** *(08:07:48)*
> "tôi chọn đề tài 1, hãy tạo 1 flow để tôi có thể bạn sẽ hướng dẫn tôi những gì tiếp đến cho đến hết dự án"

**Lý do dùng:** Sau khi phân tích quy chế thi và các gợi ý, người dùng chọn đề tài Kanban Board và cần có lộ trình rõ ràng từ đầu đến cuối dự án trong thời gian cực kỳ hạn hẹp (hạn nộp cùng ngày).  
**Kết quả:** Copilot tạo roadmap đầy đủ dạng Mermaid flowchart với 7 phases: khởi tạo dự án → Supabase setup → Auth → Core Features (CRUD + Realtime + Storage) → Docker → Deployment VPS → Báo cáo. Thời gian ước tính từng phase được liệt kê rõ ràng, giúp định hướng toàn bộ quá trình phát triển.

---

**Prompt 2** *(08:08:04)*
> "tôi chọn đề tài 1, hãy tạo 1 flow để tôi có thể biết bạn sẽ hướng dẫn tôi những gì tiếp đến cho đến hết dự án"

**Lý do dùng:** Người dùng gửi lại prompt (lần trước có lỗi gõ) để có roadmap chi tiết hơn.  
**Kết quả:** Copilot cung cấp roadmap hoàn chỉnh dưới dạng Mermaid diagram và bảng chi tiết từng phase với công nghệ tương ứng, database schema preview (`profiles`, `boards`, `columns`, `tasks`, `task_attachments`), và hướng dẫn bắt đầu ngay Phase 1.

---

**Prompt 3** *(08:09:21)*
> "viết các skill agent trước đã"

**Lý do dùng:** Trước khi bắt đầu code, cần tạo các file cấu hình GitHub Copilot (instruction files, prompt files) để AI hỗ trợ hiệu quả hơn trong suốt quá trình phát triển.  
**Kết quả:** Copilot tạo 7 file cấu hình: `.github/copilot-instructions.md` (project-wide rules), 3 instruction files (`nextjs.instructions.md`, `supabase.instructions.md`, `typescript.instructions.md`), và 3 prompt files (`new-server-action.prompt.md`, `new-supabase-table.prompt.md`, `conventional-commit.prompt.md`). Các file này tự động áp dụng khi làm việc với files tương ứng.

---

**Prompt 4** *(08:13:05)*
> "bắt đầu phase 1"

**Lý do dùng:** Kích hoạt Phase 1 — khởi tạo toàn bộ dự án Next.JS, cài đặt dependencies, tạo cấu trúc thư mục, setup git.  
**Kết quả:** Copilot thực hiện tuần tự: tạo Next.JS 15 app với TypeScript + Tailwind + App Router, cài `@supabase/ssr`, `@dnd-kit/*`, khởi tạo shadcn/ui (phát hiện và xử lý lỗi pnpm virtual store, lỗi msw build scripts), tạo toàn bộ cấu trúc thư mục (`app/(auth)`, `app/(dashboard)`, `lib/supabase`, `lib/actions`, `types`), tạo `middleware.ts`, `lib/supabase/server.ts`, `lib/supabase/client.ts`, `types/database.types.ts`, `types/index.ts`, setup git và commit đầu tiên theo Conventional Commits.

---

**Prompt 5** *(08:56:28)*
> "https://github.com/Shiin2ii/kanban-app"

**Lý do dùng:** Cung cấp URL GitHub repository để Copilot kết nối local repo với remote.  
**Kết quả:** Copilot chạy `git remote add origin`, `git branch -M main`, `git push -u origin main`. Code được đẩy lên GitHub thành công với 50 files, sẵn sàng cho CI/CD và deployment sau này.

---

**Prompt 6** *(08:59:47)*
> "bắt đầu phase 2"

**Lý do dùng:** Kích hoạt Phase 2 — setup Supabase: thiết kế database schema, RLS policies, Storage bucket, Auth configuration.  
**Kết quả:** Copilot tạo toàn bộ SQL schema gồm 5 tables (`profiles`, `boards`, `columns`, `tasks`, `task_attachments`) với đầy đủ RLS policies (SELECT/INSERT/UPDATE/DELETE) sử dụng `auth.uid()`, trigger `handle_new_user()` tự động tạo profile khi đăng ký, enable Realtime cho `tasks` và `columns`, và hướng dẫn chi tiết cấu hình Storage bucket + Auth URL settings trên Supabase Dashboard.

---

**Prompt 7** *(10:05:46)*
> "TIẾP"

**Lý do dùng:** Sau khi xong boards CRUD và board view, cần tiếp tục implement tính năng quan trọng nhất: kéo thả task (drag-and-drop) giữa các cột và trong cùng một cột.  
**Kết quả:** Copilot implement toàn bộ drag-and-drop với `@dnd-kit/core` và `@dnd-kit/sortable`: cập nhật `KanbanBoard` với `DndContext` + `onDragEnd`, thêm `SortableContext` vào `KanbanColumn`, thêm `useSortable` hook vào `TaskCard` với drag handle icon. Optimistic UI update local state ngay khi kéo, sau đó gọi `moveTask` Server Action để persist. Hỗ trợ cả kéo trong cùng cột (reorder) lẫn kéo sang cột khác.

---

**Prompt 8** *(11:05:04)*
> "làm luôn"

**Lý do dùng:** Sau khi hoàn thành tất cả tính năng (Auth, Boards, Kanban, Realtime, Storage), cần deploy lên production VPS. Người dùng chọn làm ngay.  
**Kết quả:** Copilot tạo toàn bộ infrastructure cho deployment: `Dockerfile` multi-stage build (node:22-alpine, standalone output), `docker-compose.yml` với health check, `.dockerignore`, `nginx.conf` với proxy config. Sau đó hướng dẫn build image local → push Docker Hub → pull về VPS → run container. Giải quyết vấn đề VPS 512MB RAM không đủ để build trực tiếp bằng cách tách build ra khỏi VPS.

---

**Prompt 9** *(11:26:15)*
> "hướng dẫn nginx"

**Lý do dùng:** Cần cấu hình Nginx trên VPS Ubuntu để reverse proxy từ port 80/443 vào Docker container đang chạy ở port 3000.  
**Kết quả:** Copilot cung cấp hướng dẫn từng bước: cài Nginx, tạo config `/etc/nginx/sites-available/kanban`, cấu hình `server_name`, `proxy_pass`, `proxy_set_header`. Sau đó cài certbot và chạy `certbot --nginx -d ngohotantoan.id.vn` để cấp SSL tự động. Site lên production với HTTPS thành công.

---

**Prompt 10** *(11:28:37)*
> "bị gì đã nè"

**Lý do dùng:** Sau khi cấu hình Nginx, truy cập domain bị lỗi. Cần debug nguyên nhân.  
**Kết quả:** Copilot phân tích log và phát hiện Nginx config dùng sai tên file (symlink chưa được tạo từ `sites-available` sang `sites-enabled`). Fix: `ln -s /etc/nginx/sites-available/kanban /etc/nginx/sites-enabled/`, chạy `nginx -t` để kiểm tra syntax, `systemctl reload nginx`. Domain hoạt động bình thường.

---

*Báo cáo được hoàn thành ngày 30/05/2026*
