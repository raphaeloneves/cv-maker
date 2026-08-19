-- AlterTable
ALTER TABLE "cv_optimizer_reports" ADD COLUMN     "rewriteCvId" TEXT,
ADD COLUMN     "rewriteErrorMessage" TEXT,
ADD COLUMN     "rewriteStatus" "CvOptimizerReportStatus";

-- AddForeignKey
ALTER TABLE "cv_optimizer_reports" ADD CONSTRAINT "cv_optimizer_reports_rewriteCvId_fkey" FOREIGN KEY ("rewriteCvId") REFERENCES "cvs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
