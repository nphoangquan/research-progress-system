-- Create task_grades table
CREATE TABLE "task_grades" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "score" DECIMAL(4, 2) NOT NULL,
    "feedback" TEXT,
    "graded_by" TEXT NOT NULL,
    "graded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_grades_pkey" PRIMARY KEY ("id")
);

-- Ensure enum ActivityType includes grading events
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ActivityType') THEN
        RAISE EXCEPTION 'Enum ActivityType does not exist';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'TASK_GRADED' AND enumtypid = 'public."ActivityType"'::regtype) THEN
        ALTER TYPE "ActivityType" ADD VALUE 'TASK_GRADED';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'TASK_GRADE_UPDATED' AND enumtypid = 'public."ActivityType"'::regtype) THEN
        ALTER TYPE "ActivityType" ADD VALUE 'TASK_GRADE_UPDATED';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'TASK_GRADE_DELETED' AND enumtypid = 'public."ActivityType"'::regtype) THEN
        ALTER TYPE "ActivityType" ADD VALUE 'TASK_GRADE_DELETED';
    END IF;
END $$;

-- Ensure enum NotificationType includes grading notifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
        RAISE EXCEPTION 'Enum NotificationType does not exist';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'TASK_GRADED' AND enumtypid = 'public."NotificationType"'::regtype) THEN
        ALTER TYPE "NotificationType" ADD VALUE 'TASK_GRADED';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'TASK_GRADE_UPDATED' AND enumtypid = 'public."NotificationType"'::regtype) THEN
        ALTER TYPE "NotificationType" ADD VALUE 'TASK_GRADE_UPDATED';
    END IF;
END $$;

-- Add indexes and relations
CREATE UNIQUE INDEX "task_grades_task_id_key" ON "task_grades"("task_id");
CREATE INDEX "task_grades_task_id_idx" ON "task_grades"("task_id");
CREATE INDEX "task_grades_graded_by_idx" ON "task_grades"("graded_by");

ALTER TABLE "task_grades"
    ADD CONSTRAINT "task_grades_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_grades"
    ADD CONSTRAINT "task_grades_graded_by_fkey" FOREIGN KEY ("graded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

