/**
 * Truy vấn xếp hạng theo vector (L2) cho global search khi không bật chế độ keyword.
 * Chi tiết: docs/guides/semantic-search.md
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { embeddingToPgVectorLiteral } from '../utils/vectorSql';

const DEFAULT_LIMIT = 100;

/** ID thực thể và khoảng cách L2 tới vector truy vấn. */
export type RankedId = { id: string; distance: number };

function normalizeDistance(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }
  const n = parseFloat(String(raw));
  return Number.isFinite(n) ? n : 0;
}

function mapRows(rows: Array<{ id: string; distance: unknown }>): RankedId[] {
  return rows.map((r) => ({ id: r.id, distance: normalizeDistance(r.distance) }));
}

/**
 * Lấy danh sách project ID gần vector truy vấn nhất (L2), có kiểm tra quyền theo vai trò.
 */
export async function rankProjectIdsByEmbedding(
  prisma: PrismaClient,
  queryEmbedding: number[],
  userId: string,
  userRole: string,
  options: { status?: string; dateFilter?: { gte: Date }; limit?: number }
): Promise<RankedId[]> {
  const vec = embeddingToPgVectorLiteral(queryEmbedding);
  const limit = options.limit ?? DEFAULT_LIMIT;
  const statusSql = options.status
    ? Prisma.sql`AND p.status = ${options.status}::"ProjectStatus"`
    : Prisma.empty;
  const dateSql = options.dateFilter
    ? Prisma.sql`AND p.created_at >= ${options.dateFilter.gte}`
    : Prisma.empty;

  let rows: Array<{ id: string; distance: unknown }>;

  if (userRole === 'ADMIN') {
    rows = await prisma.$queryRaw`
      SELECT p.id, (p.embedding <-> ${vec}::vector) AS distance
      FROM projects p
      WHERE p.embedding IS NOT NULL
      ${statusSql}
      ${dateSql}
      ORDER BY p.embedding <-> ${vec}::vector
      LIMIT ${limit}
    `;
  } else if (userRole === 'LECTURER') {
    rows = await prisma.$queryRaw`
      SELECT p.id, (p.embedding <-> ${vec}::vector) AS distance
      FROM projects p
      WHERE p.lecturer_id = ${userId}
        AND p.embedding IS NOT NULL
      ${statusSql}
      ${dateSql}
      ORDER BY p.embedding <-> ${vec}::vector
      LIMIT ${limit}
    `;
  } else {
    rows = await prisma.$queryRaw`
      SELECT p.id, (p.embedding <-> ${vec}::vector) AS distance
      FROM projects p
      INNER JOIN project_students ps ON ps.project_id = p.id AND ps.student_id = ${userId}
      WHERE p.embedding IS NOT NULL
      ${statusSql}
      ${dateSql}
      ORDER BY p.embedding <-> ${vec}::vector
      LIMIT ${limit}
    `;
  }

  return mapRows(rows);
}

/**
 * Lấy danh sách task ID gần vector truy vấn nhất (L2), có kiểm tra quyền theo project.
 */
export async function rankTaskIdsByEmbedding(
  prisma: PrismaClient,
  queryEmbedding: number[],
  userId: string,
  userRole: string,
  options: {
    status?: string;
    priority?: string;
    dateFilter?: { gte: Date };
    limit?: number;
  }
): Promise<RankedId[]> {
  const vec = embeddingToPgVectorLiteral(queryEmbedding);
  const limit = options.limit ?? DEFAULT_LIMIT;
  const statusSql = options.status
    ? Prisma.sql`AND t.status = ${options.status}::"TaskStatus"`
    : Prisma.empty;
  const prioritySql = options.priority
    ? Prisma.sql`AND t.priority = ${options.priority}::"Priority"`
    : Prisma.empty;
  const dateSql = options.dateFilter
    ? Prisma.sql`AND t.created_at >= ${options.dateFilter.gte}`
    : Prisma.empty;

  let rows: Array<{ id: string; distance: unknown }>;

  if (userRole === 'ADMIN') {
    rows = await prisma.$queryRaw`
      SELECT t.id, (t.embedding <-> ${vec}::vector) AS distance
      FROM tasks t
      WHERE t.embedding IS NOT NULL
      ${statusSql}
      ${prioritySql}
      ${dateSql}
      ORDER BY t.embedding <-> ${vec}::vector
      LIMIT ${limit}
    `;
  } else if (userRole === 'LECTURER') {
    rows = await prisma.$queryRaw`
      SELECT t.id, (t.embedding <-> ${vec}::vector) AS distance
      FROM tasks t
      INNER JOIN projects p ON p.id = t.project_id
      WHERE p.lecturer_id = ${userId}
        AND t.embedding IS NOT NULL
      ${statusSql}
      ${prioritySql}
      ${dateSql}
      ORDER BY t.embedding <-> ${vec}::vector
      LIMIT ${limit}
    `;
  } else {
    rows = await prisma.$queryRaw`
      SELECT t.id, (t.embedding <-> ${vec}::vector) AS distance
      FROM tasks t
      INNER JOIN projects p ON p.id = t.project_id
      INNER JOIN project_students ps ON ps.project_id = p.id AND ps.student_id = ${userId}
      WHERE t.embedding IS NOT NULL
      ${statusSql}
      ${prioritySql}
      ${dateSql}
      ORDER BY t.embedding <-> ${vec}::vector
      LIMIT ${limit}
    `;
  }

  return mapRows(rows);
}

/**
 * Lấy danh sách document ID gần vector truy vấn nhất (L2), có kiểm tra quyền theo project.
 */
export async function rankDocumentIdsByEmbedding(
  prisma: PrismaClient,
  queryEmbedding: number[],
  userId: string,
  userRole: string,
  options: { status?: string; dateFilter?: { gte: Date }; limit?: number }
): Promise<RankedId[]> {
  const vec = embeddingToPgVectorLiteral(queryEmbedding);
  const limit = options.limit ?? DEFAULT_LIMIT;
  const statusSql = options.status
    ? Prisma.sql`AND d.status = ${options.status}::"DocumentStatus"`
    : Prisma.empty;
  const dateSql = options.dateFilter
    ? Prisma.sql`AND d.created_at >= ${options.dateFilter.gte}`
    : Prisma.empty;

  let rows: Array<{ id: string; distance: unknown }>;

  if (userRole === 'ADMIN') {
    rows = await prisma.$queryRaw`
      SELECT d.id, (d.embedding <-> ${vec}::vector) AS distance
      FROM documents d
      WHERE d.embedding IS NOT NULL
      ${statusSql}
      ${dateSql}
      ORDER BY d.embedding <-> ${vec}::vector
      LIMIT ${limit}
    `;
  } else if (userRole === 'LECTURER') {
    rows = await prisma.$queryRaw`
      SELECT d.id, (d.embedding <-> ${vec}::vector) AS distance
      FROM documents d
      INNER JOIN projects p ON p.id = d.project_id
      WHERE p.lecturer_id = ${userId}
        AND d.embedding IS NOT NULL
      ${statusSql}
      ${dateSql}
      ORDER BY d.embedding <-> ${vec}::vector
      LIMIT ${limit}
    `;
  } else {
    rows = await prisma.$queryRaw`
      SELECT d.id, (d.embedding <-> ${vec}::vector) AS distance
      FROM documents d
      INNER JOIN projects p ON p.id = d.project_id
      INNER JOIN project_students ps ON ps.project_id = p.id AND ps.student_id = ${userId}
      WHERE d.embedding IS NOT NULL
      ${statusSql}
      ${dateSql}
      ORDER BY d.embedding <-> ${vec}::vector
      LIMIT ${limit}
    `;
  }

  return mapRows(rows);
}
