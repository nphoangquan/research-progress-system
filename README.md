# Research Progress Management System

Hệ thống quản lý tiến độ nghiên cứu khoa học.

## Tính năng

- Quản lý dự án nghiên cứu
- Quản lý nhiệm vụ với Kanban board
- Quản lý tài liệu và file
- Thông báo real-time qua WebSocket
- Phân tích và báo cáo tiến độ

## Công nghệ

**Frontend:**
- React 18 + TypeScript
- Vite
- TailwindCSS
- React Query

**Backend:**
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Socket.io

## Cài đặt

### Yêu cầu
- Node.js 20+
- PostgreSQL 16+

### Thiết lập

1. Clone repository:
```bash
git clone <repository-url>
cd research-progress-system
```

2. Backend:
```bash
cd backend
npm install
cp .env.example .env
# Cấu hình .env với thông tin database
npx prisma db push
npx prisma db seed
npm run dev
```

3. Frontend:
```bash
cd frontend
npm install
cp .env.example .env
# Cấu hình .env với API URL
npm run dev
```

## License

MIT License
