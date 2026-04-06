/**
 * Đánh giá định lượng semantic search (pgvector L2) so với file qrels (query relevance).
 * Dùng cùng pipeline xếp hạng với production: rankProjectIdsByEmbedding / Task / Document.
 *
 * Chuẩn bị:
 *   - OPENAI_API_KEY, DATABASE_URL trong backend/.env
 *   - File JSON qrels (xem prisma/eval/semantic-search-qrels.example.json)
 *
 * Chạy (từ thư mục backend):
 *   npm run eval-search -- ./prisma/eval/semantic-search-qrels.json
 *   npm run eval-search -- ./prisma/eval/semantic-search-qrels.json --verbose
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import embeddingService from '../services/embedding.service';
import {
  rankProjectIdsByEmbedding,
  rankTaskIdsByEmbedding,
  rankDocumentIdsByEmbedding
} from '../services/searchVector.service';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

type Entity = 'project' | 'task' | 'document';

type QrelsCase = {
  id?: string;
  query: string;
  userId?: string;
  role?: string;
  types?: Entity[];
  relevant: Partial<Record<Entity, string[]>>;
};

type QrelsFile = {
  defaultUserId: string;
  defaultRole: string;
  kValues?: number[];
  cases: QrelsCase[];
};

function precisionAtK(ranked: string[], relevant: Set<string>, k: number): number {
  if (k <= 0) return 0;
  const top = ranked.slice(0, k);
  const hits = top.filter((id) => relevant.has(id)).length;
  return hits / k;
}

function recallAtK(ranked: string[], relevant: Set<string>, k: number): number {
  if (relevant.size === 0) return NaN;
  const top = ranked.slice(0, k);
  const hits = top.filter((id) => relevant.has(id)).length;
  return hits / relevant.size;
}

/** MRR: 1/vị trí (1-based) của kết quả đúng đầu tiên; không có → 0 */
function mrr(ranked: string[], relevant: Set<string>): number {
  if (relevant.size === 0) return NaN;
  for (let i = 0; i < ranked.length; i++) {
    if (relevant.has(ranked[i])) return 1 / (i + 1);
  }
  return 0;
}

/** nDCG@K nhị phân (relevant = 1). DCG: Σ rel_i / log2(i+2) với i chỉ số 0-based → vị trí p=i+1 dùng log2(p+1). */
function dcgAtK(ranked: string[], relevant: Set<string>, k: number): number {
  let dcg = 0;
  const n = Math.min(k, ranked.length);
  for (let i = 0; i < n; i++) {
    const rel = relevant.has(ranked[i]) ? 1 : 0;
    dcg += rel / Math.log2(i + 2);
  }
  return dcg;
}

function idcgAtK(numRelevant: number, k: number): number {
  const n = Math.min(numRelevant, k);
  let idcg = 0;
  for (let i = 0; i < n; i++) {
    idcg += 1 / Math.log2(i + 2);
  }
  return idcg;
}

function ndcgAtK(ranked: string[], relevant: Set<string>, k: number): number {
  if (relevant.size === 0) return NaN;
  const dcg = dcgAtK(ranked, relevant, k);
  const idcg = idcgAtK(relevant.size, k);
  return idcg > 0 ? dcg / idcg : 0;
}

async function rankForType(
  entity: Entity,
  embedding: number[],
  userId: string,
  role: string,
  limit: number
): Promise<string[]> {
  if (entity === 'project') {
    const r = await rankProjectIdsByEmbedding(prisma, embedding, userId, role, { limit });
    return r.map((x) => x.id);
  }
  if (entity === 'task') {
    const r = await rankTaskIdsByEmbedding(prisma, embedding, userId, role, { limit });
    return r.map((x) => x.id);
  }
  const r = await rankDocumentIdsByEmbedding(prisma, embedding, userId, role, { limit });
  return r.map((x) => x.id);
}

type Agg = { sum: number; count: number };

function addAgg(a: Agg, v: number) {
  if (!Number.isFinite(v)) return;
  a.sum += v;
  a.count += 1;
}

function meanAgg(a: Agg): number {
  return a.count > 0 ? a.sum / a.count : 0;
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--verbose');
  const verbose = process.argv.includes('--verbose');
  const qrelsPath = path.resolve(process.cwd(), args[0] || 'prisma/eval/semantic-search-qrels.json');

  if (!fs.existsSync(qrelsPath)) {
    console.error(`Không thấy file qrels: ${qrelsPath}`);
    const starter = path.resolve(process.cwd(), 'prisma/eval/semantic-search-qrels.starter.json');
    if (fs.existsSync(starter)) {
      console.error(
        `Có file starter: ${starter}\n` +
          '  → Copy/rename thành semantic-search-qrels.json, hoặc chạy:\n' +
          `  npm run eval-search -- ./prisma/eval/semantic-search-qrels.starter.json`
      );
    } else {
      console.error(
        'Tạo file: npm run eval-starter-qrels  hoặc copy semantic-search-qrels.example.json → semantic-search-qrels.json'
      );
    }
    process.exit(1);
  }

  if (!embeddingService.isAvailable()) {
    console.error('Cần OPENAI_API_KEY trong .env để embed câu query.');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(qrelsPath, 'utf-8')) as QrelsFile;
  if (!raw.defaultUserId || !raw.cases?.length) {
    console.error('File qrels cần defaultUserId và ít nhất một case.');
    process.exit(1);
  }

  const kValues = (raw.kValues?.length ? raw.kValues : [5, 10, 20]).sort((a, b) => a - b);
  const rankLimit = Math.max(...kValues, 20);

  const entities: Entity[] = ['project', 'task', 'document'];
  const pAt: Record<string, Agg> = {};
  const rAt: Record<string, Agg> = {};
  const ndcgAt: Record<string, Agg> = {};
  const mrrAgg: Agg = { sum: 0, count: 0 };

  for (const k of kValues) {
    for (const e of entities) {
      pAt[`${e}@P${k}`] = { sum: 0, count: 0 };
      rAt[`${e}@R${k}`] = { sum: 0, count: 0 };
      ndcgAt[`${e}@nDCG${k}`] = { sum: 0, count: 0 };
    }
  }

  for (const c of raw.cases) {
    const userId = c.userId ?? raw.defaultUserId;
    const role = c.role ?? raw.defaultRole;
    const types = (c.types?.length ? c.types : entities) as Entity[];

    const emb = await embeddingService.generateEmbedding(c.query);
    if (!emb) {
      console.error(`Case "${c.id ?? c.query}": không embed được query.`);
      continue;
    }

    if (verbose) {
      console.log(`\n--- Case: ${c.id ?? c.query} ---`);
      console.log(`Query: ${c.query}`);
    }

    for (const entity of types) {
      const relList = c.relevant[entity] ?? [];
      const relevant = new Set(relList.filter(Boolean));
      const ranked = await rankForType(entity, emb, userId, role, rankLimit);

      if (verbose) {
        console.log(`  [${entity}] top ${Math.min(5, ranked.length)}: ${ranked.slice(0, 5).join(', ')}`);
        console.log(`  [${entity}] relevant (${relevant.size}): ${[...relevant].join(', ')}`);
      }

      if (relevant.size === 0) {
        if (verbose) console.log(`  [${entity}] bỏ qua metric — relevant rỗng (cần id đúng trong qrels)`);
        continue;
      }

      addAgg(mrrAgg, mrr(ranked, relevant));

      for (const k of kValues) {
        addAgg(pAt[`${entity}@P${k}`], precisionAtK(ranked, relevant, k));
        addAgg(rAt[`${entity}@R${k}`], recallAtK(ranked, relevant, k));
        addAgg(ndcgAt[`${entity}@nDCG${k}`], ndcgAtK(ranked, relevant, k));
      }
    }
  }

  console.log('\n========== Semantic search — đánh giá theo qrels ==========');
  console.log(`File: ${qrelsPath}`);
  console.log(`Số case: ${raw.cases.length}, K: ${kValues.join(', ')}`);
  console.log('(Trung bình macro qua các cặp (case × loại) có đủ dữ liệu; recall/nDCG/MRR bỏ qua khi relevant rỗng.)\n');

  for (const e of entities) {
    console.log(`--- ${e.toUpperCase()} ---`);
    for (const k of kValues) {
      const pk = meanAgg(pAt[`${e}@P${k}`]);
      const rk = meanAgg(rAt[`${e}@R${k}`]);
      const nk = meanAgg(ndcgAt[`${e}@nDCG${k}`]);
      console.log(
        `  P@${k}=${pk.toFixed(4)}  R@${k}=${Number.isFinite(rk) ? rk.toFixed(4) : 'n/a'}  nDCG@${k}=${Number.isFinite(nk) ? nk.toFixed(4) : 'n/a'}`
      );
    }
  }
  console.log(`\nMRR (macro, các entity có relevant > 0): ${meanAgg(mrrAgg).toFixed(4)}`);
  console.log('\nCông thức: docs/guides/semantic-search.md (mục Đánh giá định lượng)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
