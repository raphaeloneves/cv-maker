import { z } from "zod";

/** CV Optimizer (Pro feature): a user picks one of their own CVs, or uploads
 * a CV as a PDF, gives a role title and a job description (pasted text or a
 * URL fetched server-side), and gets back a Claude-generated evaluation
 * report — a blunt pass/reject verdict against six recruiter objections,
 * plus the concrete fixes that would change the verdict. This is an
 * evaluation, not a rewrite: the report tells you exactly what's wrong and
 * why, not a rewritten CV.
 *
 * Deliberately simpler than the reference implementation this was ported
 * from: one report type (no polymorphic "insight" model), one Claude call
 * (no separate evaluate-then-rewrite pipeline), no credit ledger (gated by
 * the same `hasActiveEntitlement()` subscription check as everything else
 * in billing.ts), and no job-description URL scraping happening as part of
 * generation — fetching a URL, when given one, is a plain HTTP+text-extract
 * step that runs before the Claude call, not a tool Claude has access to.
 */

export const cvOptimizerReportStatusSchema = z.enum(["pending", "processing", "completed", "failed"]);
export type CvOptimizerReportStatus = z.infer<typeof cvOptimizerReportStatusSchema>;

/** Exactly one of jobDescriptionText / jobDescriptionUrl — the UI offers
 * both as alternative ways to supply the same thing, never both at once. */
export const createCvOptimizerReportSchema = z
  .object({
    cvId: z.string().uuid(),
    roleTitle: z.string().trim().min(1).max(200),
    jobDescriptionText: z.string().trim().min(50).max(20000).optional(),
    jobDescriptionUrl: z.string().trim().url().max(2000).optional(),
  })
  .refine((data) => Boolean(data.jobDescriptionText) !== Boolean(data.jobDescriptionUrl), {
    message: "Provide either a job description or a link to one, not both.",
    path: ["jobDescriptionText"],
  });
export type CreateCvOptimizerReportInput = z.infer<typeof createCvOptimizerReportSchema>;

/** The "upload a CV" path's text fields — everything from
 * `createCvOptimizerReportSchema` except `cvId`, since the CV itself arrives
 * as a file on a separate multipart part (see routes.ts), not as JSON. */
export const createCvOptimizerReportFromUploadSchema = z
  .object({
    roleTitle: z.string().trim().min(1).max(200),
    jobDescriptionText: z.string().trim().min(50).max(20000).optional(),
    jobDescriptionUrl: z.string().trim().url().max(2000).optional(),
  })
  .refine((data) => Boolean(data.jobDescriptionText) !== Boolean(data.jobDescriptionUrl), {
    message: "Provide either a job description or a link to one, not both.",
    path: ["jobDescriptionText"],
  });
export type CreateCvOptimizerReportFromUploadInput = z.infer<typeof createCvOptimizerReportFromUploadSchema>;

// --- The structured report Claude returns (via output_config.format) -----
// Maps 1:1 onto the evaluation prompt's own sections (see llm.ts) — the
// six objections, the framework checks, gaps/strengths/priorities, and the
// final verdict. No markdown/tables in the model's own output; the
// frontend renders these fields as tables/badges itself.

export const cvOptimizerVerdictSchema = z.enum(["pass", "reject"]);
export type CvOptimizerVerdict = z.infer<typeof cvOptimizerVerdictSchema>;

export const cvOptimizerObjectionKeySchema = z.enum([
  "wasting_time",
  "raise_or_lower_standard",
  "understand_business",
  "story_coherent",
  "signal_or_noise",
  "right_scale",
]);
export type CvOptimizerObjectionKey = z.infer<typeof cvOptimizerObjectionKeySchema>;

export const cvOptimizerObjectionStatusSchema = z.enum(["pass", "partial", "reject"]);
export type CvOptimizerObjectionStatus = z.infer<typeof cvOptimizerObjectionStatusSchema>;

export const cvOptimizerObjectionSchema = z.object({
  key: cvOptimizerObjectionKeySchema,
  status: cvOptimizerObjectionStatusSchema,
  // One sentence — the scorecard row. `analysis` below is the fuller version.
  summary: z.string(),
  analysis: z.string(),
  examples: z.array(z.string()),
  actionItems: z.array(z.string()),
});
export type CvOptimizerObjection = z.infer<typeof cvOptimizerObjectionSchema>;

export const cvOptimizerFrameworkAssessmentSchema = z.object({
  ratUsage: z.string(),
  actionVerbsOwnership: z.string(),
  structureOrganization: z.string(),
  checkpointIntro: z.string(),
  checkpointFirstBullets: z.string(),
  checkpointProgression: z.string(),
  checkpointScaleClarity: z.string(),
});
export type CvOptimizerFrameworkAssessment = z.infer<typeof cvOptimizerFrameworkAssessmentSchema>;

export const cvOptimizerGapSchema = z.object({ issue: z.string(), whyItMatters: z.string() });
export type CvOptimizerGap = z.infer<typeof cvOptimizerGapSchema>;

export const cvOptimizerStrengthSchema = z.object({ point: z.string(), whyItWorks: z.string() });
export type CvOptimizerStrength = z.infer<typeof cvOptimizerStrengthSchema>;

export const cvOptimizerPriorityActionSchema = z.object({
  change: z.string(),
  whyItMatters: z.string(),
  impact: z.enum(["high", "medium", "low"]),
});
export type CvOptimizerPriorityAction = z.infer<typeof cvOptimizerPriorityActionSchema>;

export const cvOptimizerReportContentSchema = z.object({
  verdict: cvOptimizerVerdictSchema,
  verdictReasoning: z.string(),
  framework: cvOptimizerFrameworkAssessmentSchema,
  // Always all six, in the fixed order above.
  objections: z.array(cvOptimizerObjectionSchema),
  criticalGaps: z.array(cvOptimizerGapSchema),
  strongestElements: z.array(cvOptimizerStrengthSchema),
  priorityActions: z.array(cvOptimizerPriorityActionSchema),
  finalAssessment: z.string(),
  nextSteps: z.string(),
});
export type CvOptimizerReportContent = z.infer<typeof cvOptimizerReportContentSchema>;

export const cvOptimizerReportSchema = z.object({
  id: z.string().uuid(),
  cvId: z.string().uuid().nullable(),
  // Set instead of cvId when this report was run against an uploaded PDF
  // rather than one of the user's own CVs — lets the UI show what the
  // report was actually evaluated against either way.
  uploadedCvFileName: z.string().nullable(),
  roleTitle: z.string(),
  jobDescriptionUrl: z.string().nullable(),
  status: cvOptimizerReportStatusSchema,
  errorMessage: z.string().nullable(),
  reportContent: cvOptimizerReportContentSchema.nullable(),
  // "Generate an improved CV" — a second, on-demand generation scoped to
  // this report (see isEligibleForCvRewrite below). null until the user
  // triggers it; not offered at all for upload-based reports (no owned CV
  // to build the new one from — see cvId above).
  rewriteStatus: cvOptimizerReportStatusSchema.nullable(),
  rewriteCvId: z.string().uuid().nullable(),
  rewriteErrorMessage: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type CvOptimizerReport = z.infer<typeof cvOptimizerReportSchema>;

/** Score threshold for offering "Generate an improved CV": above it, the
 * gaps read as fixable by rewriting (wording, missing evidence, structure —
 * exactly what a rewrite can address); at or below it, the objections were
 * mostly outright rejects, meaning the gap is more likely a real experience
 * or scale mismatch that no rewrite closes — offering one there would
 * overpromise what the feature can deliver. */
export const CV_REWRITE_MIN_SCORE = 50;

export function isEligibleForCvRewrite(objectionsScorePercent: number | null): boolean {
  return objectionsScorePercent !== null && objectionsScorePercent > CV_REWRITE_MIN_SCORE;
}

// --- The structured rewrite Claude returns for "Generate an improved CV" --
// Deliberately narrow: only the two free-text-heavy parts of a CV that the
// evaluation's own objections/action items actually target (the summary and
// each work experience entry's bullets) get rewritten; everything else
// (education, skills, languages, hobbies, references, courses, dates,
// employer/title names) is carried over unchanged onto the new CV — see
// rewrite-cv.ts. Keeps the blast radius on identity-bearing fields at zero:
// Claude only ever supplies new prose for fields that are prose already.

export const cvOptimizerRewriteWorkExperienceSchema = z.object({
  /** Matches an existing work experience entry's id on the source CV, so
   * the new CV's entry can reuse that entry's employer/title/dates verbatim
   * and only swap in this rewritten description. */
  entryId: z.string().uuid(),
  description: z.string(),
});
export type CvOptimizerRewriteWorkExperience = z.infer<typeof cvOptimizerRewriteWorkExperienceSchema>;

export const cvOptimizerRewriteContentSchema = z.object({
  profileSummary: z.string(),
  // One per original work experience entry, same order.
  workExperience: z.array(cvOptimizerRewriteWorkExperienceSchema),
});
export type CvOptimizerRewriteContent = z.infer<typeof cvOptimizerRewriteContentSchema>;

// --- "Generate an improved CV" for the upload path -----------------------
// There's no existing structured CV to duplicate-then-patch here (see
// rewrite-cv.ts's buildRewrittenCv) — only the plain text extracted from
// the uploaded PDF. So this is extract-and-rewrite in one shot: identity
// fields (name, employer, title, dates, school, degree) are transcribed as
// literally as possible from the source text, same "never invent a fact"
// rule as the rewrite content above; only the profile summary and each
// entry's description are actually rewritten. The result becomes a real,
// fully editable CV (same builder, same section/entry endpoints as any
// other) — anything mis-extracted is a normal edit away from being fixed,
// same as anything a human mistypes when building a CV by hand.

const extractedDateFieldsSchema = z.object({
  /** Omit (null) when the source only states a year, not a month. */
  startMonth: z.number().int().min(1).max(12).nullable(),
  startYear: z.number().int(),
  endIsPresent: z.boolean(),
  endMonth: z.number().int().min(1).max(12).nullable(),
  /** Null exactly when endIsPresent is true. */
  endYear: z.number().int().nullable(),
});

export const cvOptimizerExtractedPersonalInfoSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  city: z.string().nullable(),
  linkedin: z.string().nullable(),
});
export type CvOptimizerExtractedPersonalInfo = z.infer<typeof cvOptimizerExtractedPersonalInfoSchema>;

export const cvOptimizerExtractedWorkExperienceSchema = extractedDateFieldsSchema.extend({
  title: z.string(),
  employer: z.string(),
  city: z.string().nullable(),
  /** Rewritten bullets, same HTML list format as a normal CV entry. Null
   * when the source CV has no bullets at all for this entry (common for
   * older/condensed roles) — "never invent a fact" means there's nothing
   * honest to write, not an empty `<ul></ul>` placeholder. */
  description: z.string().nullable(),
});
export type CvOptimizerExtractedWorkExperience = z.infer<typeof cvOptimizerExtractedWorkExperienceSchema>;

export const cvOptimizerExtractedEducationSchema = extractedDateFieldsSchema.extend({
  degree: z.string(),
  school: z.string(),
});
export type CvOptimizerExtractedEducation = z.infer<typeof cvOptimizerExtractedEducationSchema>;

export const cvOptimizerExtractedSkillSchema = z.object({
  name: z.string(),
  /** A reasonable 1-5 estimate of how the CV describes this skill (not a
   * fact the CV states outright) — same as picking a level when adding a
   * skill by hand; editable afterward like any other skill entry. */
  level: z.number().int().min(1).max(5),
});
export type CvOptimizerExtractedSkill = z.infer<typeof cvOptimizerExtractedSkillSchema>;

export const cvOptimizerExtractedCvSchema = z.object({
  personalInfo: cvOptimizerExtractedPersonalInfoSchema,
  profileSummary: z.string(),
  workExperience: z.array(cvOptimizerExtractedWorkExperienceSchema),
  education: z.array(cvOptimizerExtractedEducationSchema),
  skills: z.array(cvOptimizerExtractedSkillSchema),
});
export type CvOptimizerExtractedCv = z.infer<typeof cvOptimizerExtractedCvSchema>;

/** Listing-page shape — the verdict plus a computed score, without the full
 * payload. */
export const cvOptimizerReportSummarySchema = cvOptimizerReportSchema.omit({ reportContent: true }).extend({
  verdict: cvOptimizerVerdictSchema.nullable(),
  objectionsScorePercent: z.number().min(0).max(100).nullable(),
});
export type CvOptimizerReportSummary = z.infer<typeof cvOptimizerReportSummarySchema>;

/** A real, defensible 0-100 number computed from the six objection verdicts
 * (pass = 100, partial = 50, reject = 0, averaged) — not a percentage Claude
 * invents. Used to drive the score gauge's gradient in both the report list
 * (via the summary) and the report detail page, from the exact same six
 * statuses a reader sees spelled out in the report itself, so the number on
 * the gauge can never disagree with the verdicts backing it. */
export function computeObjectionsScorePercent(objections: CvOptimizerObjection[]): number {
  if (objections.length === 0) return 0;
  const points: Record<CvOptimizerObjectionStatus, number> = { pass: 100, partial: 50, reject: 0 };
  const total = objections.reduce((sum, o) => sum + points[o.status], 0);
  return Math.round(total / objections.length);
}
