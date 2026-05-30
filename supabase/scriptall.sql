
CREATE TABLE IF NOT EXISTS public.boards (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own boards"
  ON public.boards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create boards"
  ON public.boards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own boards"
  ON public.boards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own boards"
  ON public.boards FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- 3. COLUMNS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.columns (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id   uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  title      text NOT NULL,
  position   integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;

-- RLS qua JOIN tới boards (chỉ owner của board mới thao tác được column)
CREATE POLICY "Users can view columns of own boards"
  ON public.columns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = columns.board_id
        AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create columns in own boards"
  ON public.columns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = columns.board_id
        AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update columns in own boards"
  ON public.columns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = columns.board_id
        AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete columns in own boards"
  ON public.columns FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = columns.board_id
        AND boards.user_id = auth.uid()
    )
  );
  CREATE TABLE IF NOT EXISTS public.tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id   uuid NOT NULL REFERENCES public.columns(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS qua JOIN 2 cấp: tasks → columns → boards
CREATE POLICY "Users can view tasks in own boards"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.columns
      JOIN public.boards ON boards.id = columns.board_id
      WHERE columns.id = tasks.column_id
        AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks in own boards"
  ON public.tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.columns
      JOIN public.boards ON boards.id = columns.board_id
      WHERE columns.id = tasks.column_id
        AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in own boards"
  ON public.tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.columns
      JOIN public.boards ON boards.id = columns.board_id
      WHERE columns.id = tasks.column_id
        AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks in own boards"
  ON public.tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.columns
      JOIN public.boards ON boards.id = columns.board_id
      WHERE columns.id = tasks.column_id
        AND boards.user_id = auth.uid()
    )
  );
  -- ==========================================
-- 5. TASK ATTACHMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.task_attachments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_url   text NOT NULL,
  file_name  text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments of own tasks"
  ON public.task_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      JOIN public.columns ON columns.id = tasks.column_id
      JOIN public.boards ON boards.id = columns.board_id
      WHERE tasks.id = task_attachments.task_id
        AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add attachments to own tasks"
  ON public.task_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks
      JOIN public.columns ON columns.id = tasks.column_id
      JOIN public.boards ON boards.id = columns.board_id
      WHERE tasks.id = task_attachments.task_id
        AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete attachments of own tasks"
  ON public.task_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      JOIN public.columns ON columns.id = tasks.column_id
      JOIN public.boards ON boards.id = columns.board_id
      WHERE tasks.id = task_attachments.task_id
        AND boards.user_id = auth.uid()
    )
  );

-- ==========================================
-- 6. NOTIFICATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       text NOT NULL, -- 'task_overdue' | 'task_due_today' | 'task_completed' | 'board_created'
  title      text NOT NULL,
  body       text,
  is_read    boolean NOT NULL DEFAULT false,
  link       text,
  ref_id     text,          -- id của entity liên quan (task_id, board_id...)
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ngăn trùng lặp thông báo cùng loại cho cùng entity
CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_type_ref_unique
  ON public.notifications (user_id, type, ref_id)
  WHERE ref_id IS NOT NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- 7. ENABLE REALTIME
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.columns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'demo@kanbanflow.app',
  crypt('Demo@123456', gen_salt('bf')),
  now(),
  '{"username": "Tấn Toàn"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Authenticated users can upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view own attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'task-attachments'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete own attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'task-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
  ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;
-- Cho phép user upload ảnh của chính mình
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Cho phép user xóa ảnh của chính mình
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public read
CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
-- ── 2. Tạo profile ────────────────────────────────────────
INSERT INTO profiles (id, username, avatar_url, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Ngô Hồ Tấn Toàn',
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;

-- ── 3. Tạo Boards ─────────────────────────────────────────
INSERT INTO boards (id, user_id, title, created_at) VALUES
(
  'b0000001-0000-0000-0000-000000000001',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Phát triển Web App',
  now() - interval '10 days'
),
(
  'b0000002-0000-0000-0000-000000000002',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Kế hoạch Marketing',
  now() - interval '5 days'
),
(
  'b0000003-0000-0000-0000-000000000003',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Công việc cá nhân',
  now() - interval '2 days'
)
ON CONFLICT (id) DO NOTHING;

-- ── 4. Tạo Columns ────────────────────────────────────────

-- Board 1: Phát triển Web App
INSERT INTO columns (id, board_id, title, position, created_at) VALUES
('c1000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Backlog',      0, now() - interval '10 days'),
('c1000002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Đang làm',     1, now() - interval '10 days'),
('c1000003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Review',       2, now() - interval '10 days'),
('c1000004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Hoàn thành',   3, now() - interval '10 days')
ON CONFLICT (id) DO NOTHING;

-- Board 2: Kế hoạch Marketing
INSERT INTO columns (id, board_id, title, position, created_at) VALUES
('c2000001-0000-0000-0000-000000000002', 'b0000002-0000-0000-0000-000000000002', 'Ý tưởng',      0, now() - interval '5 days'),
('c2000002-0000-0000-0000-000000000002', 'b0000002-0000-0000-0000-000000000002', 'Đang triển khai', 1, now() - interval '5 days'),
('c2000003-0000-0000-0000-000000000002', 'b0000002-0000-0000-0000-000000000002', 'Đã xong',      2, now() - interval '5 days')
ON CONFLICT (id) DO NOTHING;

-- Board 3: Công việc cá nhân
INSERT INTO columns (id, board_id, title, position, created_at) VALUES
('c3000001-0000-0000-0000-000000000003', 'b0000003-0000-0000-0000-000000000003', 'Cần làm',      0, now() - interval '2 days'),
('c3000002-0000-0000-0000-000000000003', 'b0000003-0000-0000-0000-000000000003', 'Đang làm',     1, now() - interval '2 days'),
('c3000003-0000-0000-0000-000000000003', 'b0000003-0000-0000-0000-000000000003', 'Xong',         2, now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;

-- ── 5. Tạo Tasks ──────────────────────────────────────────

-- ===== BOARD 1: Phát triển Web App =====

-- Backlog
INSERT INTO tasks (id, column_id, title, description, priority, due_date, is_completed, position, created_at) VALUES
(
  't1001', 'c1000001-0000-0000-0000-000000000001',
  'Thiết kế UI/UX cho trang chủ',
  'Wireframe và mockup cho landing page. Tham khảo Figma community.',
  'high',
  (current_date + interval '3 days')::date,
  false, 0, now() - interval '9 days'
),
(
  't1002', 'c1000001-0000-0000-0000-000000000001',
  'Tích hợp thanh toán VNPay',
  'Tích hợp cổng thanh toán VNPay cho checkout flow. Cần sandbox key từ VNPay.',
  'high',
  (current_date + interval '7 days')::date,
  false, 1, now() - interval '8 days'
),
(
  't1003', 'c1000001-0000-0000-0000-000000000001',
  'Viết unit tests cho auth module',
  'Coverage phải đạt tối thiểu 80%. Dùng Jest + React Testing Library.',
  'medium',
  (current_date + interval '14 days')::date,
  false, 2, now() - interval '7 days'
),
(
  't1004', 'c1000001-0000-0000-0000-000000000001',
  'Tối ưu SEO meta tags',
  'Thêm Open Graph, Twitter Card, sitemap.xml và robots.txt.',
  'low',
  NULL,
  false, 3, now() - interval '6 days'
),
(
  't1005', 'c1000001-0000-0000-0000-000000000001',
  'Cập nhật dependencies lên phiên bản mới nhất',
  'Chạy npm audit, fix các lỗ hổng bảo mật medium/high.',
  'medium',
  (current_date - interval '2 days')::date,
  false, 4, now() - interval '5 days'
)
ON CONFLICT (id) DO NOTHING;

-- Đang làm
INSERT INTO tasks (id, column_id, title, description, priority, due_date, is_completed, position, created_at) VALUES
(
  't1006', 'c1000002-0000-0000-0000-000000000001',
  'Build tính năng kéo thả Kanban',
  'Sử dụng @dnd-kit/core và @dnd-kit/sortable. Hỗ trợ kéo giữa các cột và sắp xếp trong cùng cột.',
  'high',
  current_date::date,
  false, 0, now() - interval '4 days'
),
(
  't1007', 'c1000002-0000-0000-0000-000000000001',
  'Implement Supabase Realtime',
  'Subscribe vào postgres_changes cho bảng tasks và columns. Tự động refresh khi có thay đổi.',
  'high',
  (current_date + interval '1 day')::date,
  false, 1, now() - interval '3 days'
),
(
  't1008', 'c1000002-0000-0000-0000-000000000001',
  'Dark mode support',
  'Dùng next-themes, lưu preference vào localStorage. Hỗ trợ system preference.',
  'medium',
  (current_date + interval '2 days')::date,
  false, 2, now() - interval '2 days'
)
ON CONFLICT (id) DO NOTHING;

-- Review
INSERT INTO tasks (id, column_id, title, description, priority, due_date, is_completed, position, created_at) VALUES
(
  't1009', 'c1000003-0000-0000-0000-000000000001',
  'Review code authentication flow',
  'Kiểm tra security: CSRF protection, session expiry, rate limiting login.',
  'high',
  (current_date - interval '1 day')::date,
  false, 0, now() - interval '6 days'
),
(
  't1010', 'c1000003-0000-0000-0000-000000000001',
  'Kiểm tra responsive trên mobile',
  'Test trên iPhone 14, Samsung Galaxy S23 và iPad. Sử dụng Chrome DevTools.',
  'medium',
  current_date::date,
  false, 1, now() - interval '5 days'
)
ON CONFLICT (id) DO NOTHING;

-- Hoàn thành
INSERT INTO tasks (id, column_id, title, description, priority, due_date, is_completed, position, created_at) VALUES
(
  't1011', 'c1000004-0000-0000-0000-000000000001',
  'Setup dự án Next.JS với TypeScript',
  'Khởi tạo project với App Router, ESLint, Prettier, Tailwind CSS v4.',
  'high',
  (current_date - interval '8 days')::date,
  true, 0, now() - interval '9 days'
),
(
  't1012', 'c1000004-0000-0000-0000-000000000001',
  'Cấu hình Supabase database schema',
  'Tạo các bảng: profiles, boards, columns, tasks, task_attachments. Enable RLS.',
  'high',
  (current_date - interval '7 days')::date,
  true, 1, now() - interval '8 days'
),
(
  't1013', 'c1000004-0000-0000-0000-000000000001',
  'Deploy lên VPS DigitalOcean',
  'Docker multi-stage build, push Docker Hub, pull VPS. Nginx + SSL.',
  'high',
  (current_date - interval '3 days')::date,
  true, 2, now() - interval '4 days'
),
(
  't1014', 'c1000004-0000-0000-0000-000000000001',
  'Cấu hình domain và SSL',
  'Trỏ A record về VPS IP. Cài certbot, cấu hình HTTPS với auto-renewal.',
  'medium',
  (current_date - interval '2 days')::date,
  true, 3, now() - interval '3 days'
),
(
  't1015', 'c1000004-0000-0000-0000-000000000001',
  'Implement Server Actions cho CRUD',
  'createBoard, deleteBoard, createTask, deleteTask, moveTask, toggleTaskComplete, duplicateTask...',
  'high',
  (current_date - interval '4 days')::date,
  true, 4, now() - interval '5 days'
)
ON CONFLICT (id) DO NOTHING;

-- ===== BOARD 2: Kế hoạch Marketing =====

-- Ý tưởng
INSERT INTO tasks (id, column_id, title, description, priority, due_date, is_completed, position, created_at) VALUES
(
  't2001', 'c2000001-0000-0000-0000-000000000002',
  'Chiến dịch email marketing tháng 6',
  'Viết chuỗi 5 email onboarding cho user mới. Open rate mục tiêu > 25%.',
  'medium',
  (current_date + interval '10 days')::date,
  false, 0, now() - interval '4 days'
),
(
  't2002', 'c2000001-0000-0000-0000-000000000002',
  'Tạo landing page A/B test',
  'So sánh 2 variants: focus on features vs focus on benefits. Chạy trong 2 tuần.',
  'low',
  (current_date + interval '20 days')::date,
  false, 1, now() - interval '3 days'
),
(
  't2003', 'c2000001-0000-0000-0000-000000000002',
  'Partnership với các Tech Youtuber',
  'Liên hệ ít nhất 5 kênh có > 50K subscriber trong lĩnh vực lập trình.',
  'low',
  NULL,
  false, 2, now() - interval '2 days'
)
ON CONFLICT (id) DO NOTHING;

-- Đang triển khai
INSERT INTO tasks (id, column_id, title, description, priority, due_date, is_completed, position, created_at) VALUES
(
  't2004', 'c2000002-0000-0000-0000-000000000002',
  'Viết blog posts về Kanban methodology',
  '5 bài: Kanban là gì, Kanban vs Scrum, Kanban cho cá nhân, 10 tips, Case study.',
  'high',
  (current_date + interval '5 days')::date,
  false, 0, now() - interval '4 days'
),
(
  't2005', 'c2000002-0000-0000-0000-000000000002',
  'Setup Google Analytics 4',
  'Tích hợp GA4, cấu hình custom events: sign_up, board_created, task_completed.',
  'medium',
  current_date::date,
  false, 1, now() - interval '3 days'
),
(
  't2006', 'c2000002-0000-0000-0000-000000000002',
  'Social media content calendar',
  'Lên lịch 30 posts cho tháng 6. Format: tips, features, testimonials, memes.',
  'medium',
  (current_date - interval '1 day')::date,
  false, 2, now() - interval '2 days'
)
ON CONFLICT (id) DO NOTHING;

-- Đã xong
INSERT INTO tasks (id, column_id, title, description, priority, due_date, is_completed, position, created_at) VALUES
(
  't2007', 'c2000003-0000-0000-0000-000000000002',
  'Thiết kế logo và brand identity',
  'Logo KanbanFlow, color palette, typography guide. Delivered via Figma.',
  'high',
  (current_date - interval '4 days')::date,
  true, 0, now() - interval '5 days'
),
(
  't2008', 'c2000003-0000-0000-0000-000000000002',
  'Setup tài khoản mạng xã hội',
  'Facebook Page, LinkedIn Company, Twitter/X, Instagram. Điền đầy đủ thông tin.',
  'medium',
  (current_date - interval '3 days')::date,
  true, 1, now() - interval '4 days'
)
ON CONFLICT (id) DO NOTHING;

-- ===== BOARD 3: Công việc cá nhân =====

-- Cần làm
INSERT INTO tasks (id, column_id, title, description, priority, due_date, is_completed, position, created_at) VALUES
(
  't3001', 'c3000001-0000-0000-0000-000000000003',
  'Ôn tập môn Mạng máy tính',
  'Chương 3-5: Transport Layer, Network Layer, Data Link Layer.',
  'high',
  (current_date + interval '2 days')::date,
  false, 0, now() - interval '1 day'
),
(
  't3002', 'c3000001-0000-0000-0000-000000000003',
  'Nộp báo cáo đồ án cuối kỳ',
  'Báo cáo KanbanFlow. Format: PDF, min 20 trang, TNR 13, 1.5 spacing.',
  'high',
  current_date::date,
  false, 1, now() - interval '1 day'
),
(
  't3003', 'c3000001-0000-0000-0000-000000000003',
  'Đăng ký thi lại môn Giải tích',
  'Hạn đăng ký: ngày mai. Vào portal sinh viên, chọn học phần.',
  'medium',
  (current_date + interval '1 day')::date,
  false, 2, now() - interval '2 days'
),
(
  't3004', 'c3000001-0000-0000-0000-000000000003',
  'Đọc sách "Clean Code" — chương 6-10',
  NULL,
  'low',
  (current_date + interval '7 days')::date,
  false, 3, now() - interval '2 days'
)
ON CONFLICT (id) DO NOTHING;

-- Đang làm
INSERT INTO tasks (id, column_id, title, description, priority, due_date, is_completed, position, created_at) VALUES
(
  't3005', 'c3000002-0000-0000-0000-000000000003',
  'Chuẩn bị slide thuyết trình demo',
  '10 slides: Giới thiệu, Tech stack, Demo live, Kiến trúc, Kết luận.',
  'high',
  current_date::date,
  false, 0, now() - interval '1 day'
),
(
  't3006', 'c3000002-0000-0000-0000-000000000003',
  'Luyện tập demo 3 lần',
  'Thuyết trình không quá 15 phút. Chuẩn bị câu trả lời cho câu hỏi phản biện.',
  'high',
  current_date::date,
  false, 1, now() - interval '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- Xong
INSERT INTO tasks (id, column_id, title, description, priority, due_date, is_completed, position, created_at) VALUES
(
  't3007', 'c3000003-0000-0000-0000-000000000003',
  'Đăng ký GitHub Student Pack',
  'Nhận được: GitHub Pro, Namecheap domain miễn phí, DigitalOcean $200 credit.',
  'medium',
  (current_date - interval '5 days')::date,
  true, 0, now() - interval '6 days'
),
(
  't3008', 'c3000003-0000-0000-0000-000000000003',
  'Hoàn thiện CV xin việc intern',
  'CV 1 trang, format ATS-friendly. Thêm dự án KanbanFlow vào portfolio.',
  'high',
  (current_date - interval '3 days')::date,
  true, 1, now() - interval '4 days'
),
(
  't3009', 'c3000003-0000-0000-0000-000000000003',
  'Mua domain ngohotantoan.id.vn',
  'Domain .id.vn 1 năm ~50k VNĐ. Trỏ A record về VPS DigitalOcean.',
  'medium',
  (current_date - interval '7 days')::date,
  true, 2, now() - interval '8 days'
)
ON CONFLICT (id) DO NOTHING;

-- ── 6. Xác nhận kết quả ───────────────────────────────────
SELECT
  'profiles'        AS table_name, COUNT(*) AS rows FROM profiles
UNION ALL SELECT 'boards',        COUNT(*) FROM boards
UNION ALL SELECT 'columns',       COUNT(*) FROM columns
UNION ALL SELECT 'tasks',         COUNT(*) FROM tasks
UNION ALL SELECT 'attachments',   COUNT(*) FROM task_attachments
ORDER BY table_name;
