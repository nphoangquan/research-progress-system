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
