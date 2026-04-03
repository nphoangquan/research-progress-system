/** Đồng bộ với Prisma `vector(1536)` và API embedding (1536 chiều). */
export const EMBEDDING_DIMENSIONS = 1536;

/**
 * Chuyển mảng số thành literal PostgreSQL dùng cho ép kiểu `::vector` (chỉ số hữu hạn).
 * @throws {Error} Khi độ dài khác {@link EMBEDDING_DIMENSIONS} hoặc phần tử không hợp lệ
 */
export function embeddingToPgVectorLiteral(embedding: number[]): string {
  if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Embedding must be a numeric array of length ${EMBEDDING_DIMENSIONS}`);
  }
  for (let i = 0; i < embedding.length; i++) {
    const n = embedding[i];
    if (typeof n !== 'number' || !Number.isFinite(n)) {
      throw new Error('Embedding contains invalid number');
    }
  }
  return '[' + embedding.join(',') + ']';
}

/**
 * Ánh xạ khoảng cách L2 từ pgvector (`<->`, cùng họ index IVFFlat `vector_l2_ops`) sang điểm dạng 0..1 để hiển thị/sắp xếp.
 */
export function l2DistanceToSemanticScore(distance: number): number {
  if (!Number.isFinite(distance) || distance < 0) {
    return 0;
  }
  return 1 / (1 + distance);
}
