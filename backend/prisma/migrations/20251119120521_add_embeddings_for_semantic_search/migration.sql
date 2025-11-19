-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "embedding" vector(1536);

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "embedding" vector(1536);

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "embedding" vector(1536);

-- Create IVFFlat indexes for vector similarity search
CREATE INDEX IF NOT EXISTS "projects_embedding_idx" ON "projects" USING ivfflat ("embedding" vector_l2_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS "tasks_embedding_idx" ON "tasks" USING ivfflat ("embedding" vector_l2_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS "documents_embedding_idx" ON "documents" USING ivfflat ("embedding" vector_l2_ops) WITH (lists = 100);
