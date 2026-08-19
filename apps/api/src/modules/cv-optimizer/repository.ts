import type { CvOptimizerReport, CvOptimizerReportStatus, CvOptimizerReportSummary } from "@cv-maker/contracts";
import { computeObjectionsScorePercent } from "@cv-maker/contracts";
import { db } from "../../db.js";
import { enumToDb, enumToDomain } from "../common/enum-map.js";
import type { CvOptimizerReportStatus as PrismaCvOptimizerReportStatus } from "../../../generated/client/index.js";

type Row = Awaited<ReturnType<typeof db.cvOptimizerReport.findFirstOrThrow>>;

export function reportToDomain(row: Row): CvOptimizerReport {
  return {
    id: row.id,
    cvId: row.cvId,
    uploadedCvFileName: row.uploadedCvFileName,
    roleTitle: row.roleTitle,
    jobDescriptionUrl: row.jobDescriptionUrl,
    status: enumToDomain(row.status),
    errorMessage: row.errorMessage,
    // Stored as Prisma `Json`; already the exact shape of
    // cvOptimizerReportContentSchema when present (see llm.ts, which parses
    // Claude's response through that schema before this ever gets written).
    reportContent: (row.reportContent as CvOptimizerReport["reportContent"]) ?? null,
    rewriteStatus: row.rewriteStatus ? enumToDomain<CvOptimizerReportStatus>(row.rewriteStatus) : null,
    rewriteCvId: row.rewriteCvId,
    rewriteErrorMessage: row.rewriteErrorMessage,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function reportToSummary(row: Row): CvOptimizerReportSummary {
  const content = row.reportContent as CvOptimizerReport["reportContent"];
  const { reportContent: _omit, ...report } = reportToDomain(row);
  return {
    ...report,
    verdict: content?.verdict ?? null,
    objectionsScorePercent: content ? computeObjectionsScorePercent(content.objections) : null,
  };
}

export function findReportById(id: string) {
  return db.cvOptimizerReport.findUnique({ where: { id } });
}

export function listReportsForUser(userId: string) {
  return db.cvOptimizerReport.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/** `cvSource` is exactly one of the two ways a report can get its CV — an
 * existing owned CV, or an uploaded PDF already reduced to plain text (see
 * pdf-text.ts) — never both, matching the two mutually-exclusive creation
 * routes in routes.ts. */
export function createReport(params: {
  userId: string;
  roleTitle: string;
  jobDescription: string;
  jobDescriptionUrl: string | null;
  cvSource: { type: "existing"; cvId: string } | { type: "upload"; fileName: string; text: string };
}) {
  return db.cvOptimizerReport.create({
    data: {
      userId: params.userId,
      roleTitle: params.roleTitle,
      jobDescription: params.jobDescription,
      jobDescriptionUrl: params.jobDescriptionUrl,
      status: "PENDING",
      ...(params.cvSource.type === "existing"
        ? { cvId: params.cvSource.cvId }
        : { uploadedCvFileName: params.cvSource.fileName, uploadedCvText: params.cvSource.text }),
    },
  });
}

export function setReportStatus(id: string, status: CvOptimizerReportStatus) {
  return db.cvOptimizerReport.update({
    where: { id },
    data: { status: enumToDb<PrismaCvOptimizerReportStatus>(status) },
  });
}

export function completeReport(id: string, reportContent: unknown) {
  return db.cvOptimizerReport.update({
    where: { id },
    data: { status: "COMPLETED", reportContent: reportContent as object, errorMessage: null },
  });
}

export function failReport(id: string, errorMessage: string) {
  return db.cvOptimizerReport.update({
    where: { id },
    data: { status: "FAILED", errorMessage },
  });
}

export function setRewriteStatus(id: string, status: CvOptimizerReportStatus) {
  return db.cvOptimizerReport.update({
    where: { id },
    data: { rewriteStatus: enumToDb<PrismaCvOptimizerReportStatus>(status), rewriteErrorMessage: null },
  });
}

export function completeRewrite(id: string, rewriteCvId: string) {
  return db.cvOptimizerReport.update({
    where: { id },
    data: { rewriteStatus: "COMPLETED", rewriteCvId, rewriteErrorMessage: null },
  });
}

export function failRewrite(id: string, errorMessage: string) {
  return db.cvOptimizerReport.update({
    where: { id },
    data: { rewriteStatus: "FAILED", rewriteErrorMessage: errorMessage },
  });
}
