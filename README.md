# 🏢 Deku Workspace - Enterprise Collaboration & AI Platform

[![Next.js](https://img.shields.io/badge/Next.js-13.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-Serverless-336791?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Prisma](https://img.shields.io/badge/Prisma-5.2-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![LiveKit](https://img.shields.io/badge/LiveKit-WebRTC-FF5722?style=for-the-badge)](https://livekit.io/)
[![Clerk](https://img.shields.io/badge/Clerk-Authentication-6C47FF?style=for-the-badge)](https://clerk.com/)
[![Tests Status](https://img.shields.io/badge/Test_Bot-100%25_PASS-brightgreen?style=for-the-badge)](https://deku-workspace.vercel.app/test-bot)

> **Deku Workspace** là nền tảng hợp tác, họp trực tuyến WebRTC và quản trị điều hành doanh nghiệp All-in-One tích hợp Trí tuệ Nhân tạo (AI), kết hợp giữa trải nghiệm tương tác thời gian thực của Discord, năng lực tổ chức công việc phân quyền 3 tầng của Lark Base và sức mạnh trợ lý tự động hóa thông minh (ChatGPT-Grade).

---

## 📚 TÀI LIỆU BÁO CÁO & THUYẾT TRÌNH DỰ ÁN
* 📄 **[Báo Cáo Dự Án Chi Tiết Toàn Diện (A-Z)](BAO_CAO_DU_AN_DEKU_WORKSPACE.md)**: Bản tài liệu kỹ thuật đầy đủ về kiến trúc, cơ sở dữ liệu, phân quyền bảo mật 3 tầng, AI và đánh giá hiệu quả kinh tế.
* 🎯 **[Bộ Slide Thuyết Trình PowerPoint (Pitch Deck)](SLIDE_THUYET_TRINH_POWERPOINT.md)**: 12 Slide thuyết trình chuẩn chuyên nghiệp, có bố cục trực quan kèm lời thoại Speaker Notes chi tiết từng giây.

---

## 🌟 ĐIỂM NHẤN CÔNG NGHỆ & TÍNH NĂNG NỔI BẬT

### 1. 🤖 Hôm Nay & Trợ Lý AI Doanh Nghiệp (ChatGPT-Grade AI)
- **AI Morning Briefing**: Tự động tổng hợp và tóm tắt đầu ngày về lịch họp, công việc đến hạn khẩn cấp và chỉ thị cần ký.
- **Tự động giao việc bằng ngôn ngữ tự nhiên**: Người dùng chỉ cần gõ *"Giao việc cho [Tên]: [Nội dung]"*, AI tự động trích xuất deadline, khởi tạo Task và đẩy thông báo vào AI của nhân sự tương ứng.
- **Sổ tay cá nhân riêng tư**: Ghi chú mã hóa hai chiều theo từng cá nhân.
- **Cấp quyền & Thư mời thông minh**: Tạo link mời nhân sự mới qua token onboarding tức thì.

### 2. 📊 Lark Base Quản Trị & Quy Tắc Bảo Mật 3 Tầng (Quy Tắc B6)
- **Bảng việc tổ đa góc nhìn**: Chuyển đổi linh hoạt giữa Bảng dữ liệu Grid View và Bảng Kanban Board kéo thả.
- **Phân quyền ma trận 3 tầng**:
  - `Ban Giám Đốc (Boss)`: Toàn quyền truy cập và điều hành tất cả các khối phòng ban.
  - `Tổ Trưởng (Lead)`: Toàn quyền quản lý và phân công công việc nội bộ của tổ mình.
  - `Nhân Sự (HR)`: Quản lý hồ sơ, danh bạ nhân sự nhưng **bị chặn truy cập (HTTP 403 Forbidden)** đối với việc nội bộ của tổ để bảo vệ bí mật dự án.

### 3. 🎥 Phòng Họp Trực Tuyến WebRTC & Biên Bản Họp AI
- Hội nghị truyền hình chất lượng cao độ trễ < 150ms trên nền tảng **LiveKit WebRTC**.
- Tính năng giơ tay phát biểu (`use-raise-hand`), phụ đề trực tiếp đa ngôn ngữ và tạo biên bản tóm tắt cuộc họp AI (Meeting Minutes) tự động.

### 4. 📰 Cổng Bảng Tin Có Ký Nhận & Threads Nội Bộ
- Ban Giám Đốc ban hành chỉ thị với các mức độ ưu tiên; nhân sự bấm **"Ký nhận"** sẽ được ghi vết thời gian bất biến vào **Nhật ký kiểm toán (Audit Logs)**.
- Mạng xã hội sáng kiến **Threads Nội Bộ** cho phép toàn bộ nhân viên đăng ý tưởng cải tiến quy trình và thảo luận theo luồng.

### 5. 💻📱 Hệ Sinh Thái Đa Nền Tảng (Multi-Platform Ecosystem)
- **Web App**: Hoạt động mượt mà trên mọi trình duyệt tại `https://deku-workspace.vercel.app`.
- **PC Windows App**: Bộ cài 1-Click `Deku-Workspace-Setup.cmd` tạo biểu tượng Desktop độc lập.
- **Mobile App PWA**: Quét mã QR tại `/download` để cài ứng dụng lên iPhone/Android, hỗ trợ lưu cache offline.

### 6. 🤖 Bot Tự Động Kiểm Thử Toàn Diện (Auto-Test Bot)
- Tích hợp công cụ Test Bot tự động chạy kiểm tra 22 bước từ đăng nhập, AI, phân quyền 3 tầng đến WebRTC với tỷ lệ thành công đạt **100% PASS**.

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY (LOCAL DEVELOPMENT)

### Yêu cầu môi trường
- Node.js v18.x trở lên
- npm hoặc yarn
- Tài khoản Neon PostgreSQL, Clerk, LiveKit và UploadThing

### Các bước cài đặt
```bash
# 1. Clone repository
git clone https://github.com/Vangkuquagiaki/deku-workspace.git
cd deku-workspace

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Cấu hình biến môi trường (.env)
cp .env.example .env

# 4. Sinh Prisma Client và nạp dữ liệu mẫu
npx prisma generate
npm run seed

# 5. Khởi chạy máy chủ phát triển
npm run dev
```

### Chạy Bot Kiểm Thử Tự Động
```bash
# Chạy Test Bot kiểm tra toàn diện 22 bước
npm run test:bot
```

---

## 👥 THÀNH VIÊN DỰ ÁN & BẢN QUYỀN
Dự án được thiết kế và phát triển bởi **Deku Engineering Team**. Mọi quyền được bảo lưu © 2026.
