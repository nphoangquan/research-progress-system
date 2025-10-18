-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('PROJECT', 'REFERENCE', 'TEMPLATE', 'GUIDELINE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('RESTRICTED', 'STUDENT', 'LECTURER', 'PUBLIC');

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "access_level" "AccessLevel" NOT NULL DEFAULT 'RESTRICTED',
ADD COLUMN     "category" "DocumentCategory" NOT NULL DEFAULT 'PROJECT',
ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "is_system_project" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "documents_category_idx" ON "documents"("category");

-- CreateIndex
CREATE INDEX "documents_access_level_idx" ON "documents"("access_level");

-- CreateIndex
CREATE INDEX "documents_is_public_idx" ON "documents"("is_public");

-- CreateIndex
CREATE INDEX "projects_is_system_project_idx" ON "projects"("is_system_project");
