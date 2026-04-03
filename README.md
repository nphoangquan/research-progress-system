# Research Progress Management System

Hệ thống quản lý tiến độ nghiên cứu khoa học (dự án, nhiệm vụ, tài liệu, phân quyền).

## Tính năng

- **Dự án & nhiệm vụ:** Kanban, trạng thái, deadline, chấm điểm nhiệm vụ, nhãn (labels), file đính kèm, bình luận
- **Tài liệu:** upload, quản lý file (tùy chọn Cloudinary)
- **Tìm kiếm:** full-text + **semantic** (pgvector + embedding, bật qua biến môi trường)
- **Người dùng:** đăng ký/đăng nhập, JWT, vai trò (admin / giảng viên / sinh viên)
- **Admin:** quản lý user, import/export, cài đặt hệ thống (email, storage, bảo trì), nhật ký/audit
- **Real-time:** thông báo qua Socket.io
- **Khác:** analytics/báo cáo, bộ lọc nâng cao, chế độ bảo trì, rate limit, gửi mail (SMTP tùy chọn)

## Công nghệ

| Tầng | Stack |
|------|--------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, React Query |
| Backend | Node.js, Express, TypeScript, Prisma, Socket.io |
| Dữ liệu | PostgreSQL 16 + **pgvector** (semantic search) |

## Chạy bằng Docker

**Dev:**

```bash
docker compose up --build
```

Web: `http://localhost` (nginx), API qua proxy; Postgres host: `localhost:5432`.

**Production:** dùng riêng `docker-compose.prod.yml` (không merge với file dev):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up --build
```

Chi tiết image tag xem comment đầu `docker-compose.prod.yml`.

## Cài đặt local (không Docker)

### Yêu cầu

- Node.js 20+
- PostgreSQL 16+ có extension **pgvector**

### Thiết lập

1. Clone repo, vào thư mục project.

2. Backend:

```bash
cd backend
npm install
cp .env.example .env
# Cấu hình DATABASE_URL, JWT_SECRET, ...
npx prisma db push
npx prisma db seed
npm run dev
```

3. Frontend:

```bash
cd frontend
npm install
cp .env.example .env
# API URL (ví dụ VITE_API_URL)
npm run dev
```
