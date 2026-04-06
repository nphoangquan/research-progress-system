# Backend Scripts

Thư mục này chứa các script tiện ích để quản lý và bảo trì hệ thống.

## Danh sách Scripts

### sync-embeddings.ts

Script đồng bộ embeddings cho dữ liệu có sẵn trong database.

**Công dụng:**
- Generate embeddings cho projects, tasks, documents chưa có embeddings
- Sử dụng khi:
  - Vừa enable tính năng semantic search
  - Import data từ nguồn khác
  - Database bị mất embeddings (restore backup cũ)
  - Cần re-index toàn bộ dữ liệu

**Yêu cầu:**
- OPENAI_API_KEY phải được cấu hình trong .env
- Database phải có sẵn dữ liệu
- Kết nối internet để gọi OpenAI API

**Cách sử dụng:**

```bash
cd backend

# Sync tất cả entities (projects, tasks, documents)
npm run sync-embeddings

# Hoặc sync từng loại riêng lẻ:
npm run sync-embeddings -- projects
npm run sync-embeddings -- tasks
npm run sync-embeddings -- documents
```

**Output mẫu:**

```
════════════════════════════════════════════════════════════
  EMBEDDING SYNC SCRIPT
════════════════════════════════════════════════════════════

[INFO] Bắt đầu đồng bộ embeddings cho TẤT CẢ entities...

KẾT QUẢ ĐỒNG BỘ:

Projects:
  Total:  4
  Synced: 4

Tasks:
  Total:  13
  Synced: 13

Documents:
  Total:  7
  Synced: 7

TỔNG KẾT:
  Thành công: 24

Thời gian thực hiện: 12.34s
[SUCCESS] Đồng bộ embeddings hoàn tất!
```

**Lưu ý:**
- Script xử lý theo batch (20 items/lần) để tránh rate limiting
- Có thể mất vài phút nếu có nhiều dữ liệu
- Chi phí OpenAI API phụ thuộc vào số lượng text cần embedding
- Nếu bị interrupt (Ctrl+C), có thể chạy lại - script chỉ sync items chưa có embedding

**Troubleshooting:**

Lỗi: "OPENAI_API_KEY chưa được cấu hình"
- Kiểm tra file .env có OPENAI_API_KEY=sk-...
- Đảm bảo API key hợp lệ và còn credit

Lỗi: "Embedding sync đã đang chạy"
- Có một instance khác đang chạy
- Đợi hoàn tất hoặc restart server

Lỗi kết nối database:
- Kiểm tra DATABASE_URL trong .env
- Đảm bảo PostgreSQL đang chạy

Rate limiting từ OpenAI:
- Script tự động xử lý theo batch
- Nếu vẫn bị, giảm BATCH_SIZE trong embeddingSync.service.ts

---

### evaluate-semantic-search.ts — đo P@K, R@K, MRR, nDCG

**Chuẩn bị**

1. `backend/.env`: `DATABASE_URL` (với Docker DB trên máy dùng `127.0.0.1:5432`), `OPENAI_API_KEY`.
2. Dữ liệu đã có embedding: `npm run sync-embeddings` (nếu chưa).
3. **Lấy **UUID admin****
   - `npm run eval-list-ids` — in sẵn `defaultUserId` + bảng `id` + tiêu đề (project / task / document) để copy vào JSON.
   - hoặc `npm run eval-starter-qrels` — tạo `prisma/eval/semantic-search-qrels.starter.json` (mỗi project một case, `query` tạm = title; nên sửa `query` để đo semantic). Copy file đó thành `semantic-search-qrels.json` rồi chỉnh. (Không dùng `eval-list-ids -- --starter`: npm có thể nuốt cờ `--starter`.)
4. Hoặc copy từ `semantic-search-qrels.example.json` → `semantic-search-qrels.json` và sửa tay như hướng dẫn cũ.

5. Lấy **UUID admin** (bảng `users`, role ADMIN) — dùng cho `defaultUserId`.
6. Copy `prisma/eval/semantic-search-qrels.example.json` → `prisma/eval/semantic-search-qrels.json`, sửa:
   - `defaultUserId`
   - Mỗi `case`: `query` + `relevant.project` / `task` / `document` (id **đúng** bạn chọn làm đáp án).
**Chạy**

```bash
cd backend
npm run eval-search -- ./prisma/eval/semantic-search-qrels.json
npm run eval-search -- ./prisma/eval/semantic-search-qrels.json --verbose
```

Script in ra **P@K, R@K, nDCG@K** theo từng loại (project/task/document) và **MRR**. Thứ tự xếp hạng lấy **thật** từ Postgres (cùng SQL semantic như production).

---

## Thêm Scripts Mới

Khi tạo script mới, tuân theo template:

```typescript
#!/usr/bin/env ts-node
/**
 * Script Name
 * 
 * Brief description of what this script does.
 * 
 * Usage:
 *   npm run script-name
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
  try {
    // Your logic here
    console.log('Success!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log('\nStopping script...');
  process.exit(0);
});

main();
```

**Lưu ý:** Các scripts thường chạy trực tiếp với database. Luôn backup dữ liệu quan trọng trước!
