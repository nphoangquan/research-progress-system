/**
 * Tạo nhanh nhiều project / task / document (placeholder) để test, đặc biệt semantic search.
 * Chạy từ thư mục backend. DB: .env (DATABASE_URL) — với Docker dùng localhost:5432.
 *
 *   npm run seed-bulk
 *   BULK_SEED_PROJECTS=300 BULK_SEED_TASKS_PER_PROJECT=5 npm run seed-bulk
 *   BULK_SEED_RESET=1 npm run seed-bulk   # xóa dữ liệu [Bulk Seed] cũ rồi tạo lại
 *
 * Sau đó (bắt buộc cho semantic): OPENAI_API_KEY trong .env → npm run sync-embeddings
 */

import dotenv from 'dotenv';
import path from 'path';
import {
  PrismaClient,
  ProjectStatus,
  TaskStatus,
  Priority,
  DocumentStatus,
  DocumentCategory,
  AccessLevel
} from '@prisma/client';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

const TITLE_PREFIX = '[Bulk Seed]';

/** Nội dung đa dạng để query semantic có kết quả khác nhau */
const CORPUS: { kw: string; title: string; blurb: string }[] = [
  { kw: 'AI giáo dục', title: 'AI trong lớp học hỗn hợp', blurb: 'Thích ứng nội dung theo học sinh, chatbot gia sư, đánh giá tự động bài tập.' },
  { kw: 'IoT y tế', title: 'Giám sát sinh hiệu từ xa', blurb: 'Cảm biến đeo được, cảnh báo nhồi máu cơ tim, tích hợp bệnh viện thông minh.' },
  { kw: 'climate', title: 'Carbon footprint campus', blurb: 'Ước lượng phát thải từ điện, giao thông sinh viên; đề xuất giảm rác thải nhựa.' },
  { kw: 'NLP tiếng Việt', title: 'Phân loại ý kiến khách hàng', blurb: 'Fine-tune BERT đa ngữ cho review Shopee, xử lý teencode và emoji.' },
  { kw: 'robotics', title: 'Robot dọn phòng dorms', blurb: 'SLAM hành lang hẹp, tránh va chạm, lập lịch quét theo giờ im lặng.' },
  { kw: 'fintech', title: 'Phát hiện giao dịch gian lận', blurb: 'Graph neural network trên mạng chuyển tiền, real-time scoring.' },
  { kw: 'computer vision', title: 'Kiểm tra chất lượng linh kiện', blurb: 'Phát hiện vết xước PCB, so sánh ảnh với golden sample trên dây chuyền.' },
  { kw: 'blockchain', title: 'Chứng chỉ học tập không thể sửa', blurb: 'NFT metadata cho bằng điểm, xác minh nhà tuyển dụng không cần trường.' },
  { kw: 'quantum', title: 'Tối ưu lịch thi bằng QAOA', blurb: 'Mô hình hóa ràng buộc phòng, giám thị; so sánh với heuristic cổ điển.' },
  { kw: 'edge AI', title: 'Nhận dạng cử chỉ trên MCU', blurb: 'TinyML, quantize model, độ trễ dưới 50ms cho điều khiển thiết bị.' },
  { kw: 'semantic web', title: 'Đồ thị tri thức môn học', blurb: 'Liên kết prerequisite, gợi ý lộ trình học cá nhân hóa.' },
  { kw: 'HCI', title: 'Khả năng tiếp cận LMS', blurb: 'WCAG 2.2, screen reader, tương phản màu cho thị lực kém.' },
  { kw: 'cybersecurity', title: 'Zero trust cho lab máy tính', blurb: 'Micro-segmentation, xác thực thiết bị trước khi vào VLAN nội bộ.' },
  { kw: 'data warehouse', title: 'ETL khảo thí đại học', blurb: 'Làm sạch điểm nhiều kỳ, slowly changing dimension giảng viên.' },
  { kw: 'recommendation', title: 'Gợi ý đề tài theo sở thích', blurb: 'Collaborative filtering + embedding paper abstract ArXiv.' },
  { kw: 'AR VR', title: 'Phòng lab ảo hóa học', blurb: 'Tương tác phân tử 3D, giảm rủi ro hóa chất thật.' },
  { kw: '5G', title: 'Streaming lab thực hành từ xa', blurb: 'Độ trễ thấp điều khiển oscilloscope qua campus network.' },
  { kw: 'bioinformatics', title: 'Alignment sequence DNA', blurb: 'So khớp mẫu bệnh nhân với mutation đã biết trong literature.' },
  { kw: 'GIS', title: 'Heatmap an toàn giao thông SV', blurb: 'Tổng hợp incident quanh ký túc xá, cảnh báo tuyến đi về đêm.' },
  { kw: 'energy', title: 'Dự báo tải điện tòa nhà', blurb: 'LSTM theo giờ, tối ưu bật tắt HVAC giảm chi phí.' }
];

function parseIntEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const projectCount = parseIntEnv('BULK_SEED_PROJECTS', 120);
  const tasksPerProject = parseIntEnv('BULK_SEED_TASKS_PER_PROJECT', 4);
  const docsPerProject = parseIntEnv('BULK_SEED_DOCUMENTS_PER_PROJECT', 1);
  const reset = process.env.BULK_SEED_RESET === '1' || process.env.BULK_SEED_RESET === 'true';

  if (projectCount === 0) {
    console.log('BULK_SEED_PROJECTS=0 — không làm gì.');
    return;
  }

  const lecturer = await prisma.user.findFirst({ where: { role: 'LECTURER' } });
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  if (!lecturer || !student) {
    console.error('Cần ít nhất 1 LECTURER và 1 STUDENT. Chạy: npx prisma db seed');
    process.exit(1);
  }

  if (reset) {
    console.log(`Xóa dữ liệu cũ (${TITLE_PREFIX}*)...`);
    const deleted = await prisma.project.deleteMany({
      where: { title: { startsWith: TITLE_PREFIX } }
    });
    console.log(`Đã xóa ${deleted.count} project (cascade task/document/chunk).`);
  }

  const start = Date.now();
  const startDate = new Date();
  const projectRows: {
    title: string;
    description: string;
    lecturerId: string;
    status: ProjectStatus;
    startDate: Date;
    endDate: Date | null;
    progress: number;
    isSystemProject: boolean;
  }[] = [];

  for (let i = 0; i < projectCount; i++) {
    const c = CORPUS[i % CORPUS.length];
    const title = `${TITLE_PREFIX} #${i + 1} — ${c.title}`;
    const description = `[${c.kw}] ${c.blurb} Mã loạt: bulk-${i + 1}.`;
    projectRows.push({
      title,
      description,
      lecturerId: lecturer.id,
      status: ProjectStatus.IN_PROGRESS,
      startDate,
      endDate: null,
      progress: Math.min(95, 5 + (i % 20) * 4),
      isSystemProject: false
    });
  }

  console.log(`Tạo ${projectRows.length} project (createMany theo lô)...`);
  for (const batch of chunk(projectRows, 80)) {
    await prisma.project.createMany({ data: batch });
  }

  const projects = await prisma.project.findMany({
    where: { title: { startsWith: TITLE_PREFIX } },
    select: { id: true },
    orderBy: { title: 'asc' }
  });
  const projectIds = projects.map((p) => p.id);
  console.log(`Đã có ${projectIds.length} project bulk trong DB.`);

  console.log('Gán sinh viên (MEMBER) cho từng project...');
  for (const batch of chunk(projectIds, 200)) {
    await prisma.projectStudent.createMany({
      data: batch.map((projectId) => ({
        projectId,
        studentId: student.id,
        role: 'MEMBER'
      })),
      skipDuplicates: true
    });
  }

  const taskRows: {
    projectId: string;
    title: string;
    description: string;
    assigneeId: string;
    status: TaskStatus;
    priority: Priority;
  }[] = [];

  let t = 0;
  for (const projectId of projectIds) {
    for (let k = 0; k < tasksPerProject; k++) {
      const c = CORPUS[(t + k) % CORPUS.length];
      taskRows.push({
        projectId,
        title: `${TITLE_PREFIX} task ${t}-${k}: ${c.kw}`,
        description: `Công việc thử nghiệm: ${c.blurb}`,
        assigneeId: student.id,
        status: k % 3 === 0 ? TaskStatus.COMPLETED : TaskStatus.IN_PROGRESS,
        priority: [Priority.LOW, Priority.MEDIUM, Priority.HIGH][k % 3]
      });
    }
    t += tasksPerProject;
  }

  if (taskRows.length > 0) {
    console.log(`Tạo ${taskRows.length} task...`);
    for (const batch of chunk(taskRows, 100)) {
      await prisma.task.createMany({ data: batch });
    }
  }

  if (docsPerProject > 0) {
    const docRows: {
      projectId: string;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
      uploadedBy: string;
      description: string;
      status: DocumentStatus;
      category: DocumentCategory;
      accessLevel: AccessLevel;
      isPublic: boolean;
    }[] = [];

    let d = 0;
    for (const projectId of projectIds) {
      for (let k = 0; k < docsPerProject; k++) {
        const c = CORPUS[d % CORPUS.length];
        docRows.push({
          projectId,
          fileName: `bulk-doc-${projectId.slice(0, 8)}-${k}.pdf`,
          fileUrl: 'https://example.invalid/bulk-placeholder.pdf',
          fileSize: 1024 + (d % 10000),
          mimeType: 'application/pdf',
          uploadedBy: student.id,
          description: `Tài liệu thử: ${c.title}. ${c.blurb}`,
          status: DocumentStatus.APPROVED,
          category: DocumentCategory.PROJECT,
          accessLevel: AccessLevel.RESTRICTED,
          isPublic: false
        });
        d++;
      }
    }
    console.log(`Tạo ${docRows.length} document (metadata)...`);
    for (const batch of chunk(docRows, 80)) {
      await prisma.document.createMany({ data: batch });
    }
  }

  const sec = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nXong trong ${sec}s.`);
  console.log('Bước tiếp theo (semantic search): đặt OPENAI_API_KEY trong backend/.env rồi chạy:');
  console.log('  npm run sync-embeddings');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
