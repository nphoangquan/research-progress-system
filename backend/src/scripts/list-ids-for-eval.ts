/**
 * In id + tiêu đề từ DB để copy vào semantic-search-qrels.json,
 * hoặc tạo file qrels khởi đầu (mỗi project 1 case, query = title — sửa query sau).
 *
 *   npm run eval-list-ids              → in bảng ra terminal
 *   npm run eval-starter-qrels         → ghi prisma/eval/semantic-search-qrels.starter.json
 *
 * (Đừng dùng `npm run eval-list-ids -- --starter`: npm mới có thể nuốt cờ --starter.)
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  const starter =
    process.argv.includes('--starter') || process.env.EVAL_STARTER === '1';

  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, email: true }
  });

  if (!admin) {
    console.error('Không tìm thấy user ADMIN. Chạy: npx prisma db seed');
    process.exit(1);
  }

  const projectTake = starter ? 500 : 50;
  const projects = await prisma.project.findMany({
    take: projectTake,
    orderBy: { title: 'asc' },
    select: { id: true, title: true }
  });

  const tasks = await prisma.task.findMany({
    take: 80,
    orderBy: { title: 'asc' },
    select: {
      id: true,
      title: true,
      project: { select: { title: true } }
    }
  });

  const documents = await prisma.document.findMany({
    take: 50,
    orderBy: { fileName: 'asc' },
    select: {
      id: true,
      fileName: true,
      description: true,
      project: { select: { title: true } }
    }
  });

  if (starter) {
    const cases = projects.map((p) => ({
      id: `proj-${p.id.slice(0, 8)}`,
      query: p.title,
      relevant: {
        project: [p.id],
        task: [] as string[],
        document: [] as string[]
      }
    }));

    const out = {
      defaultUserId: admin.id,
      defaultRole: 'ADMIN',
      kValues: [5, 10, 20],
      cases,
      _comment:
        'Tạo bởi npm run eval-starter-qrels. Query = title từ DB; sửa query để đo semantic. Copy → semantic-search-qrels.json, có thể xóa _comment.'
    };

    const outPath = path.resolve(process.cwd(), 'prisma/eval/semantic-search-qrels.starter.json');
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf-8');
    console.log(`Đã ghi ${outPath} (${cases.length} case).`);
    console.log('Sửa query / thêm case task-document / copy → semantic-search-qrels.json');
    return;
  }

  console.log('\n=== Dùng cho file qrels ===\n');
  console.log(`"defaultUserId": "${admin.id}"   // ${admin.email}\n`);

  console.log('--- PROJECT (dán id vào relevant.project) ---');
  for (const p of projects) {
    console.log(`${p.id}\t${p.title.slice(0, 80)}`);
  }

  console.log('\n--- TASK (relevant.task) ---');
  for (const t of tasks) {
    console.log(`${t.id}\t${t.title.slice(0, 60)} | ${t.project.title.slice(0, 40)}`);
  }

  console.log('\n--- DOCUMENT (relevant.document) ---');
  for (const d of documents) {
    const desc = (d.description ?? '').replace(/\s+/g, ' ').slice(0, 50);
    console.log(`${d.id}\t${d.fileName} | ${desc}`);
  }

  console.log(`
Cách làm:
1. Copy dòng defaultUserId vào semantic-search-qrels.json
2. Thêm từng "case": viết "query" (câu bạn muốn thử), "relevant" chỉ cần id đúng (copy từ bảng trên)
3. Hoặc: npm run eval-starter-qrels  → tạo prisma/eval/semantic-search-qrels.starter.json
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
