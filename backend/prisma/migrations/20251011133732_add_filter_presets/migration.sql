-- CreateTable
CREATE TABLE "filter_presets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filters" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filter_presets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "filter_presets_user_id_idx" ON "filter_presets"("user_id");

-- CreateIndex
CREATE INDEX "filter_presets_entity_type_idx" ON "filter_presets"("entity_type");

-- CreateIndex
CREATE INDEX "filter_presets_is_public_idx" ON "filter_presets"("is_public");

-- CreateIndex
CREATE UNIQUE INDEX "filter_presets_user_id_name_entity_type_key" ON "filter_presets"("user_id", "name", "entity_type");

-- AddForeignKey
ALTER TABLE "filter_presets" ADD CONSTRAINT "filter_presets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
