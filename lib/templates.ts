export type TemplateTask = {
  title: string
  priority: "low" | "medium" | "high"
}

export type TemplateColumn = {
  title: string
  tasks: TemplateTask[]
}

export type BoardTemplate = {
  id: string
  name: string
  description: string
  emoji: string
  color: string   // board color id (matches BOARD_COLORS in kanban-board.tsx)
  columns: TemplateColumn[]
}

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: "software",
    name: "Phát triển phần mềm",
    description: "Quản lý sprint và backlog theo quy trình Agile",
    emoji: "🚀",
    color: "blue",
    columns: [
      {
        title: "Backlog",
        tasks: [
          { title: "Thiết kế database schema", priority: "high" },
          { title: "Viết unit test cho auth module", priority: "medium" },
          { title: "Tối ưu query SQL", priority: "low" },
        ],
      },
      {
        title: "To Do",
        tasks: [
          { title: "Tạo API endpoint xác thực", priority: "high" },
          { title: "Cài đặt CI/CD pipeline", priority: "medium" },
        ],
      },
      {
        title: "In Progress",
        tasks: [
          { title: "Xây dựng giao diện dashboard", priority: "high" },
        ],
      },
      {
        title: "Code Review",
        tasks: [
          { title: "Review PR #12: thêm pagination", priority: "medium" },
        ],
      },
      {
        title: "Done",
        tasks: [
          { title: "Khởi tạo dự án & cấu hình môi trường", priority: "low" },
        ],
      },
    ],
  },
  {
    id: "project",
    name: "Quản lý dự án",
    description: "Theo dõi tiến độ dự án từ kế hoạch đến hoàn thành",
    emoji: "📋",
    color: "violet",
    columns: [
      {
        title: "Lên kế hoạch",
        tasks: [
          { title: "Phân tích yêu cầu khách hàng", priority: "high" },
          { title: "Ước tính ngân sách & thời gian", priority: "high" },
          { title: "Lập kế hoạch rủi ro", priority: "medium" },
        ],
      },
      {
        title: "Đang thực hiện",
        tasks: [
          { title: "Họp kick-off dự án", priority: "high" },
          { title: "Thiết kế wireframe", priority: "medium" },
        ],
      },
      {
        title: "Chờ duyệt",
        tasks: [
          { title: "Bàn giao tài liệu thiết kế", priority: "medium" },
        ],
      },
      {
        title: "Hoàn thành",
        tasks: [
          { title: "Ký hợp đồng dự án", priority: "low" },
        ],
      },
    ],
  },
  {
    id: "personal",
    name: "Công việc cá nhân",
    description: "Sắp xếp công việc cá nhân và mục tiêu hàng ngày",
    emoji: "👤",
    color: "green",
    columns: [
      {
        title: "Hộp thư đến",
        tasks: [
          { title: "Trả lời email công việc", priority: "high" },
          { title: "Đặt lịch khám sức khỏe", priority: "medium" },
          { title: "Mua sắm cuối tuần", priority: "low" },
        ],
      },
      {
        title: "Hôm nay",
        tasks: [
          { title: "Tập thể dục buổi sáng", priority: "medium" },
          { title: "Đọc sách 30 phút", priority: "low" },
        ],
      },
      {
        title: "Tuần này",
        tasks: [
          { title: "Hoàn thành báo cáo tháng", priority: "high" },
          { title: "Gọi điện cho gia đình", priority: "medium" },
        ],
      },
      {
        title: "Đã xong",
        tasks: [],
      },
    ],
  },
  {
    id: "marketing",
    name: "Marketing & Content",
    description: "Lên kế hoạch và theo dõi chiến dịch marketing",
    emoji: "📣",
    color: "pink",
    columns: [
      {
        title: "Ý tưởng",
        tasks: [
          { title: "Video review sản phẩm mới", priority: "medium" },
          { title: "Bài blog SEO về tính năng X", priority: "low" },
          { title: "Chiến dịch email retargeting", priority: "high" },
        ],
      },
      {
        title: "Đang sản xuất",
        tasks: [
          { title: "Thiết kế banner quảng cáo Q2", priority: "high" },
          { title: "Viết nội dung landing page", priority: "medium" },
        ],
      },
      {
        title: "Chờ phê duyệt",
        tasks: [
          { title: "Kịch bản TVC 30s", priority: "high" },
        ],
      },
      {
        title: "Đã xuất bản",
        tasks: [
          { title: "Post Facebook Tết Nguyên Đán", priority: "low" },
        ],
      },
    ],
  },
  {
    id: "study",
    name: "Học tập & Nghiên cứu",
    description: "Theo dõi tài liệu học, khóa học và ghi chú",
    emoji: "📚",
    color: "orange",
    columns: [
      {
        title: "Cần học",
        tasks: [
          { title: "Khóa học TypeScript nâng cao", priority: "high" },
          { title: "Đọc sách Clean Code", priority: "medium" },
          { title: "Tìm hiểu về Docker Swarm", priority: "low" },
        ],
      },
      {
        title: "Đang học",
        tasks: [
          { title: "Next.js 15 App Router", priority: "high" },
          { title: "Supabase Realtime", priority: "medium" },
        ],
      },
      {
        title: "Ôn tập",
        tasks: [
          { title: "Flashcard SQL cơ bản", priority: "medium" },
        ],
      },
      {
        title: "Hoàn thành",
        tasks: [
          { title: "Giới thiệu về React", priority: "low" },
        ],
      },
    ],
  },
  {
    id: "bugtracker",
    name: "Bug Tracker",
    description: "Quản lý và theo dõi lỗi phần mềm theo vòng đời",
    emoji: "🐛",
    color: "red",
    columns: [
      {
        title: "Báo cáo",
        tasks: [
          { title: "[BUG] Lỗi đăng nhập trên Safari", priority: "high" },
          { title: "[BUG] Ảnh không tải được trên mobile", priority: "medium" },
          { title: "[BUG] Pagination hiển thị sai số trang", priority: "low" },
        ],
      },
      {
        title: "Đang tái hiện",
        tasks: [
          { title: "[BUG] Crash khi upload file > 10MB", priority: "high" },
        ],
      },
      {
        title: "Đang sửa",
        tasks: [
          { title: "[BUG] Token hết hạn không redirect", priority: "high" },
        ],
      },
      {
        title: "Kiểm tra",
        tasks: [
          { title: "[FIX] Sửa lỗi CORS trên API prod", priority: "medium" },
        ],
      },
      {
        title: "Đã đóng",
        tasks: [
          { title: "[FIX] Lỗi timezone UTC+7", priority: "low" },
        ],
      },
    ],
  },
]
