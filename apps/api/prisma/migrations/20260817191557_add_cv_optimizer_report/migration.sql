-- CreateEnum
CREATE TYPE "CvOptimizerReportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "cv_optimizer_reports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cvId" TEXT,
    "roleTitle" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "jobDescriptionUrl" TEXT,
    "status" "CvOptimizerReportStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "reportContent" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cv_optimizer_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cv_optimizer_reports_userId_idx" ON "cv_optimizer_reports"("userId");

-- AddForeignKey
ALTER TABLE "cv_optimizer_reports" ADD CONSTRAINT "cv_optimizer_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_optimizer_reports" ADD CONSTRAINT "cv_optimizer_reports_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
