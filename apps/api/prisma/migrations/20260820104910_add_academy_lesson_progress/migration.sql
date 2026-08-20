-- CreateTable
CREATE TABLE "academy_lesson_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonSlug" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academy_lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academy_lesson_progress_userId_lessonSlug_key" ON "academy_lesson_progress"("userId", "lessonSlug");

-- AddForeignKey
ALTER TABLE "academy_lesson_progress" ADD CONSTRAINT "academy_lesson_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
