import type { BuilderLocale, CreateCvOptimizerReportFromUploadInput, CreateCvOptimizerReportInput, UserRole } from "@cv-maker/contracts";
import { computeObjectionsScorePercent, hasActiveEntitlement, isEligibleForCvRewrite } from "@cv-maker/contracts";
import { badRequest, conflict, forbidden, notFound } from "../../errors.js";
import { getOwnedCv } from "../cvs/service.js";
import { cvToDomain } from "../cvs/repository.js";
import { getRenderData } from "../cv-render-data/service.js";
import { findSubscriptionByUserId, subscriptionToDomain } from "../billing/repository.js";
import { findUserById } from "../auth/repository.js";
import { localeToDomain } from "../common/enum-map.js";
import * as repo from "./repository.js";
import { fetchJobDescriptionText } from "./job-description.js";
import { generateReport } from "./llm.js";
import { generateCvFromUpload, generateRewrite } from "./rewrite-llm.js";
import { buildCvFromExtraction, buildRewrittenCv } from "./rewrite-cv.js";

async function requireEntitled(userId: string, role: UserRole): Promise<void> {
  const row = await findSubscriptionByUserId(userId);
  const subscription = row ? subscriptionToDomain(row) : null;
  if (!hasActiveEntitlement(subscription, role)) {
    throw forbidden("CV Optimizer is a Pro feature. Upgrade to use it.");
  }
}

/** The requesting user's own account language preference — what every
 * Claude call in this module writes its output in (report prose, rewritten
 * CV prose), regardless of what language the CV or job description happen
 * to be in. Fetched once per report/rewrite creation, not re-read later. */
async function getAccountLocale(userId: string): Promise<BuilderLocale> {
  const user = await findUserById(userId);
  return user ? localeToDomain(user.locale) : "en";
}

export async function listReports(userId: string) {
  const rows = await repo.listReportsForUser(userId);
  return rows.map(repo.reportToSummary);
}

export async function getReport(reportId: string, userId: string) {
  const row = await repo.findReportById(reportId);
  if (!row || row.userId !== userId) throw notFound("Report not found");
  return repo.reportToDomain(row);
}

/** Creates the report row synchronously (including resolving the job
 * description, so a bad URL fails the request immediately rather than
 * surfacing later as a silently-failed report), then kicks off the one
 * Claude call in the background — no job queue, no retry/credit
 * bookkeeping. The caller polls `GET /cv-optimizer/reports/:id` for
 * status, same shape as the reference product's async flow, just without
 * its queue infrastructure. */
export async function createReport(
  userId: string,
  role: UserRole,
  input: CreateCvOptimizerReportInput,
) {
  await requireEntitled(userId, role);
  const cv = await getOwnedCv(input.cvId, userId);
  const locale = await getAccountLocale(userId);

  const jobDescription = input.jobDescriptionUrl
    ? await fetchJobDescriptionText(input.jobDescriptionUrl)
    : (input.jobDescriptionText as string);

  const row = await repo.createReport({
    userId,
    roleTitle: input.roleTitle,
    jobDescription,
    jobDescriptionUrl: input.jobDescriptionUrl ?? null,
    cvSource: { type: "existing", cvId: cv.id },
  });

  void runGeneration(row.id, userId, role, locale, input.roleTitle, jobDescription, {
    type: "existing",
    cvId: cv.id,
  });

  return repo.reportToDomain(row);
}

/** The "upload a CV" path (see routes.ts's multipart route and
 * pdf-text.ts) — `cvFile` is already resolved to plain text by the time this
 * runs; this function never touches the PDF itself, only its extracted
 * text. No `getOwnedCv` here since there's no CV entity at all: the report's
 * `cvId` stays null and `uploadedCvFileName`/`uploadedCvText` carry the
 * provenance instead (see repository.ts). */
export async function createReportFromUpload(
  userId: string,
  role: UserRole,
  input: CreateCvOptimizerReportFromUploadInput,
  cvFile: { fileName: string; text: string },
) {
  await requireEntitled(userId, role);
  const locale = await getAccountLocale(userId);

  const jobDescription = input.jobDescriptionUrl
    ? await fetchJobDescriptionText(input.jobDescriptionUrl)
    : (input.jobDescriptionText as string);

  const row = await repo.createReport({
    userId,
    roleTitle: input.roleTitle,
    jobDescription,
    jobDescriptionUrl: input.jobDescriptionUrl ?? null,
    cvSource: { type: "upload", fileName: cvFile.fileName, text: cvFile.text },
  });

  void runGeneration(row.id, userId, role, locale, input.roleTitle, jobDescription, {
    type: "upload",
    text: cvFile.text,
  });

  return repo.reportToDomain(row);
}

/** "Generate an improved CV" — kicks off a second, on-demand Claude call
 * scoped to an already-completed report, then builds a brand new real `Cv`
 * from its result (see rewrite-cv.ts). Re-checks entitlement, ownership,
 * the report's own eligibility (score), and its current rewrite state
 * server-side — never trusts that the button was only shown when it should
 * have been. Branches on whether the report has an owned source CV
 * (duplicate-then-patch, `runRewriteGeneration`) or only the uploaded PDF's
 * text (extract-then-patch, `runRewriteGenerationFromUpload`) — see
 * rewrite-llm.ts's two generate functions for why those are different
 * calls, not one. */
export async function createRewrite(reportId: string, userId: string, role: UserRole) {
  await requireEntitled(userId, role);

  const row = await repo.findReportById(reportId);
  if (!row || row.userId !== userId) throw notFound("Report not found");
  const report = repo.reportToDomain(row);

  if (report.status !== "completed" || !report.reportContent) {
    throw badRequest("This report hasn't finished generating yet.");
  }
  if (!report.cvId && !row.uploadedCvText) {
    throw badRequest("This report has no CV to build an improved version from.");
  }
  const score = computeObjectionsScorePercent(report.reportContent.objections);
  if (!isEligibleForCvRewrite(score)) {
    throw badRequest("This CV's objections score is too low for a rewrite to meaningfully help — see the report's priority actions instead.");
  }
  if (report.rewriteStatus === "pending" || report.rewriteStatus === "processing") {
    throw conflict("An improved CV is already being generated for this report.");
  }

  const locale = await getAccountLocale(userId);
  const updatedRow = await repo.setRewriteStatus(reportId, "pending");

  if (report.cvId) {
    const cv = cvToDomain(await getOwnedCv(report.cvId, userId));
    void runRewriteGeneration(reportId, userId, role, {
      cvId: cv.id,
      cvTitle: cv.title,
      templateId: cv.templateId,
      contentLanguage: cv.contentLanguage,
      locale,
      roleTitle: report.roleTitle,
      jobDescription: row.jobDescription,
      reportContent: report.reportContent,
    });
  } else {
    void runRewriteGenerationFromUpload(reportId, userId, {
      uploadedCvText: row.uploadedCvText as string,
      fileName: report.uploadedCvFileName,
      locale,
      roleTitle: report.roleTitle,
      jobDescription: row.jobDescription,
      reportContent: report.reportContent,
    });
  }

  return repo.reportToDomain(updatedRow);
}

async function runRewriteGeneration(
  reportId: string,
  userId: string,
  role: UserRole,
  params: {
    cvId: string;
    cvTitle: string;
    templateId: string;
    contentLanguage: "pt-PT" | "en";
    locale: BuilderLocale;
    roleTitle: string;
    jobDescription: string;
    reportContent: NonNullable<Awaited<ReturnType<typeof repo.reportToDomain>>["reportContent"]>;
  },
): Promise<void> {
  try {
    await repo.setRewriteStatus(reportId, "processing");
    const cvData = await getRenderData(params.cvId, userId, role);
    const rewrite = await generateRewrite({
      roleTitle: params.roleTitle,
      jobDescription: params.jobDescription,
      outputLocale: params.locale,
      cv: cvData,
      report: params.reportContent,
    });
    const newCvId = await buildRewrittenCv({
      userId,
      sourceCvId: params.cvId,
      sourceTemplateId: params.templateId,
      sourceContentLanguage: params.contentLanguage,
      newTitle: `${params.cvTitle} (Optimized)`,
      rewrite,
    });
    await repo.completeRewrite(reportId, newCvId);
  } catch (err) {
    console.error(`[cv-optimizer] rewrite for report ${reportId} failed:`, err);
    await repo.failRewrite(reportId, "Something went wrong generating the improved CV. Please try again.");
  }
}

async function runRewriteGenerationFromUpload(
  reportId: string,
  userId: string,
  params: {
    uploadedCvText: string;
    fileName: string | null;
    locale: BuilderLocale;
    roleTitle: string;
    jobDescription: string;
    reportContent: NonNullable<Awaited<ReturnType<typeof repo.reportToDomain>>["reportContent"]>;
  },
): Promise<void> {
  try {
    await repo.setRewriteStatus(reportId, "processing");
    const extraction = await generateCvFromUpload({
      roleTitle: params.roleTitle,
      jobDescription: params.jobDescription,
      outputLocale: params.locale,
      cvText: params.uploadedCvText,
      report: params.reportContent,
    });
    const newCvId = await buildCvFromExtraction({
      userId,
      newTitle: params.fileName ? `${params.fileName.replace(/\.pdf$/i, "")} (Optimized)` : "Optimized CV",
      contentLanguage: params.locale,
      extraction,
    });
    await repo.completeRewrite(reportId, newCvId);
  } catch (err) {
    console.error(`[cv-optimizer] rewrite-from-upload for report ${reportId} failed:`, err);
    await repo.failRewrite(reportId, "Something went wrong generating the improved CV. Please try again.");
  }
}

async function runGeneration(
  reportId: string,
  userId: string,
  role: UserRole,
  locale: BuilderLocale,
  roleTitle: string,
  jobDescription: string,
  cvSource: { type: "existing"; cvId: string } | { type: "upload"; text: string },
): Promise<void> {
  try {
    await repo.setReportStatus(reportId, "processing");
    const content =
      cvSource.type === "existing"
        ? await generateReport({
            roleTitle,
            jobDescription,
            outputLocale: locale,
            cv: await getRenderData(cvSource.cvId, userId, role),
          })
        : await generateReport({ roleTitle, jobDescription, outputLocale: locale, cvText: cvSource.text });
    await repo.completeReport(reportId, content);
  } catch (err) {
    // Log the real cause (API auth/rate-limit/schema-validation detail) for
    // operators; store a plain, generic message for the user — the raw
    // Anthropic error string isn't something a customer should have to read
    // or can act on.
    console.error(`[cv-optimizer] report ${reportId} failed:`, err);
    await repo.failReport(reportId, "Something went wrong generating this report. Please try again.");
  }
}
