import { apiGet, apiPost, apiPostMultipart } from "@/lib/api-client";
import type {
  CreateCvOptimizerReportFromUploadInput,
  CreateCvOptimizerReportInput,
  CvOptimizerReport,
  CvOptimizerReportSummary,
} from "@cv-maker/contracts";

/** CV Optimizer (Pro feature) — see docs/api-routes.md "CV Optimizer".
 * All three routes sit behind `requireAuth` + the same `hasActiveEntitlement`
 * check as billing; a non-entitled caller gets a 403 whose message is
 * surfaced as-is rather than replaced with a generic error. Generation has
 * no queue — `createReport` returns immediately with `status: "pending"`,
 * and the caller polls `getReport` until it settles. */
export function listReports(): Promise<CvOptimizerReportSummary[]> {
  return apiGet<CvOptimizerReportSummary[]>("/cv-optimizer/reports");
}

export function getReport(reportId: string): Promise<CvOptimizerReport> {
  return apiGet<CvOptimizerReport>(`/cv-optimizer/reports/${reportId}`);
}

export function createReport(input: CreateCvOptimizerReportInput): Promise<CvOptimizerReport> {
  return apiPost<CvOptimizerReport>("/cv-optimizer/reports", input);
}

/** The "upload a CV" path — multipart, not JSON, since the CV itself is a
 * PDF file rather than a `cvId`. */
export function createReportFromUpload(
  input: CreateCvOptimizerReportFromUploadInput,
  cvFile: File,
): Promise<CvOptimizerReport> {
  const form = new FormData();
  form.append("roleTitle", input.roleTitle);
  if (input.jobDescriptionText) form.append("jobDescriptionText", input.jobDescriptionText);
  if (input.jobDescriptionUrl) form.append("jobDescriptionUrl", input.jobDescriptionUrl);
  form.append("cvFile", cvFile, cvFile.name);
  return apiPostMultipart<CvOptimizerReport>("/cv-optimizer/reports/upload", form);
}

/** Retries generation for a report that failed — same inputs already
 * stored on the report, so no body to send. Poll `getReport` same as
 * creation. */
export function retryReport(reportId: string): Promise<CvOptimizerReport> {
  return apiPost<CvOptimizerReport>(`/cv-optimizer/reports/${reportId}/retry`);
}

/** "Generate an improved CV" — no body, everything it needs already lives on
 * the report. Returns the report with `rewriteStatus: "pending"`; poll
 * `getReport` same as report generation itself. */
export function createRewrite(reportId: string): Promise<CvOptimizerReport> {
  return apiPost<CvOptimizerReport>(`/cv-optimizer/reports/${reportId}/rewrite`);
}
