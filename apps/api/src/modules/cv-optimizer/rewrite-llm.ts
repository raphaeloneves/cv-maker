import Anthropic from "@anthropic-ai/sdk";
import { cvOptimizerExtractedCvSchema, cvOptimizerRewriteContentSchema } from "@cv-maker/contracts";
import type {
  CvOptimizerExtractedCv,
  CvOptimizerReportContent,
  CvOptimizerRewriteContent,
} from "@cv-maker/contracts";
import type { CvRenderData } from "@cv-maker/contracts";
import { env } from "../../env.js";
import type { ZodType } from "zod";

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

/** Shared call+parse plumbing for both rewrite-style calls below — same
 * mechanics as llm.ts's generateReport (stream, check for refusal, extract
 * the text block, parse as JSON, then re-validate through the matching zod
 * schema as defense in depth against output_config.format alone). */
async function runStructuredCall<T>(params: {
  system: string;
  jsonSchema: Record<string, unknown>;
  userContent: unknown;
  responseSchema: ZodType<T>;
}): Promise<T> {
  const stream = client.messages.stream({
    model: "claude-sonnet-5",
    max_tokens: 16000,
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: params.jsonSchema },
    },
    system: params.system,
    messages: [{ role: "user", content: JSON.stringify(params.userContent) }],
  });

  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") {
    throw new Error("Claude declined to generate a result for this input.");
  }

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude's response didn't include the expected structured output.");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(textBlock.text);
  } catch {
    throw new Error("Claude's response wasn't valid JSON.");
  }

  return params.responseSchema.parse(parsedJson);
}

const REWRITE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["profileSummary", "workExperience"],
  properties: {
    profileSummary: { type: "string", description: "The rewritten profile summary, 2-4 sentences." },
    workExperience: {
      type: "array",
      description: "One item per work experience entry in cv_json, same entryId, same order.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["entryId", "description"],
        properties: {
          entryId: { type: "string", description: "The matching entry's id from cv_json." },
          description: { type: "string", description: "Rewritten bullets, same HTML list format as the original." },
        },
      },
    },
  },
} as const;

/** Second-stage prompt — the "Generate an improved CV" call. Written to be
 * used by the same panel that produced the evaluation, now applying its own
 * findings, not a fresh generic "make this better" prompt. Deliberately
 * narrow in scope (see cv-optimizer.ts's comment on
 * cvOptimizerRewriteContentSchema): only asked to touch the two places where
 * wording is genuinely the problem, and explicitly forbidden from inventing
 * facts — the single rule most likely to be violated by a naive "polish this
 * CV" prompt, and the one that would make this feature actively harmful if
 * it were. */
const SYSTEM_PROMPT = `You are the same panel of three hiring experts who produced the CV evaluation report for this candidate — a resume writer, a career coach, and a recruiter. You already told them exactly what needs to change. Now you write it.

You get four things in one shot: the role title, the job description, the candidate's CV as structured data, and the full evaluation report you already produced for that exact role and CV. Use the report's critical gaps and priority actions as your rewrite brief — you are fixing the specific problems you already found, not starting over.

WHAT YOU REWRITE
Only two things: the profile summary, and each work experience entry's bullet points (its description). Everything else — education, skills, languages, dates, employers, job titles, certifications, the order of sections — stays exactly as it is. You are not writing a new CV from scratch; you are fixing the two places where wording is the actual problem.

THE ONE RULE THAT MATTERS MOST
Never invent a fact. Every number, outcome, tool, team size, or responsibility you write must already exist somewhere in the original CV, or be a direct, defensible restatement of something that does. If the CV doesn't say how many people someone managed, you don't get to say five. If a number isn't there, don't add one — sharpen the sentence around what's actually true instead. Fabricating experience is worse than a weak bullet; it would make this CV dishonest in exactly the way the evaluation report was written to catch in someone else's CV.

HOW YOU FIX WHAT THE REPORT FOUND
Apply the RAT framework: keep Responsibility and Accomplishment distinct, lead with ownership verbs (led, built, delivered, established), cut passive phrasing like "responsible for" or "helped with". Address the specific critical gaps and priority actions from the evaluation report directly: if it said the summary buries seniority, fix that; if it said a bullet undersells scope, rewrite it to state exactly what already happened, more clearly and with the right emphasis for this specific job. Keep each entry's bullets reasonable in number (2-5), tightened, never padded with filler.

EVERY ROLE GETS REWRITTEN, EVEN THE ONES THAT LOOK LESS RELEVANT
The evaluation report judges the CV against this one job, and that's correct for the report. It is not license to blank out or hollow out an earlier role in the rewrite just because it doesn't look like a direct match. A candidate who is now a VP of Engineering was once a Principal Engineer or an Engineering Manager, and that history is exactly where a reader finds the depth and range that make the current seniority credible; dropping it reads as a thinner career, not a sharper one. If cv_json gives you real content for an entry, you always return a rewritten description for it. Never leave a description blank, near-empty, or a single generic line as a way of signaling "not relevant." Instead, rewrite that entry the same way you'd rewrite any other: find the responsibility and accomplishment already in the original bullets that reads as transferable value for this specific job (technical judgment, scope of ownership, people or budget managed, decisions that held up, problems solved under real constraints) and put that framing front and center. The goal is never to invent relevance that isn't there; it's to surface the relevance that already is there but is buried in the wrong words. If, after genuinely trying, an entry's original content truly does not connect to this job in any way, still tighten it under the RAT framework rather than leaving it thin. Cutting an entry from the CV entirely is a call for the person to make deliberately in the editor afterward, not one you make silently by leaving it empty.

WHAT LANGUAGE YOU WRITE IN
Write the profile summary and every bullet in output_language, the language given to you in the input — this is the candidate's own account language preference, not necessarily the language the CV happens to be written in. If the original CV is in a different language, translate the prose faithfully into output_language, but never translate, reword, or alter a proper noun, employer name, tool name, date, or number: those stay exactly as given, verbatim, even inside a translated sentence. Translating faithfully is not the same as inventing — the one rule above still applies in full.

Return one workExperience item per entry in cv_json's work experience section, using that entry's own id as entryId, in the same order.

Return your answer only as the structured JSON object described by the response schema — no other commentary.`;

export interface GenerateRewriteInput {
  roleTitle: string;
  jobDescription: string;
  cv: CvRenderData;
  report: CvOptimizerReportContent;
  /** The account's own locale — what the rewritten prose gets written in,
   * regardless of what language the CV/job description happen to be in
   * (see SYSTEM_PROMPT's "WHAT LANGUAGE YOU WRITE IN"). */
  outputLocale: "pt-PT" | "en";
}

/** The "Generate an improved CV" call — a second, on-demand Claude request
 * scoped to one already-completed report (see service.ts's `createRewrite`).
 * Same model/effort defaults as the evaluation call in llm.ts, for the same
 * cost-vs-quality reasoning; revisit both together if either turns out to
 * need more. */
export async function generateRewrite(input: GenerateRewriteInput): Promise<CvOptimizerRewriteContent> {
  return runStructuredCall({
    system: SYSTEM_PROMPT,
    jsonSchema: REWRITE_JSON_SCHEMA,
    userContent: {
      role_applied_for: input.roleTitle,
      job_description: input.jobDescription,
      cv_json: input.cv,
      evaluation_report: input.report,
      output_language: input.outputLocale,
    },
    responseSchema: cvOptimizerRewriteContentSchema,
  });
}

// --- "Generate an improved CV" for the upload path ------------------------
// No existing structured CV to duplicate here — only the plain text
// extracted from the uploaded PDF (see pdf-text.ts / cv-optimizer.ts's
// comment on cvOptimizerExtractedCvSchema). One call does both jobs:
// transcribe the CV into structured data, and rewrite the two free-text
// parts using the same evaluation report as the existing-CV path.

const EXTRACTED_DATE_FIELDS_JSON_SCHEMA = {
  startMonth: { type: ["integer", "null"], description: "1-12, or null if the source only states a year." },
  startYear: { type: "integer" },
  endIsPresent: { type: "boolean", description: "True if the CV says this is current/ongoing." },
  endMonth: { type: ["integer", "null"], description: "1-12, or null if year-only or endIsPresent is true." },
  endYear: { type: ["integer", "null"], description: "Null exactly when endIsPresent is true." },
} as const;

const EXTRACT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["personalInfo", "profileSummary", "workExperience", "education", "skills"],
  properties: {
    personalInfo: {
      type: "object",
      additionalProperties: false,
      required: ["firstName", "lastName", "email", "phone", "city", "linkedin"],
      properties: {
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string" },
        phone: { type: ["string", "null"] },
        city: { type: ["string", "null"] },
        linkedin: { type: ["string", "null"] },
      },
    },
    profileSummary: { type: "string", description: "The rewritten profile summary, 2-4 sentences." },
    workExperience: {
      type: "array",
      description: "One item per work experience entry found in the CV text, most recent first.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "employer", "city", "description", ...Object.keys(EXTRACTED_DATE_FIELDS_JSON_SCHEMA)],
        properties: {
          title: { type: "string" },
          employer: { type: "string" },
          city: { type: ["string", "null"] },
          description: {
            type: ["string", "null"],
            description:
              "Rewritten bullets as an HTML list, e.g. <ul><li>...</li></ul>. Null if the source text has no bullets at all for this entry — never a placeholder or invented content.",
          },
          ...EXTRACTED_DATE_FIELDS_JSON_SCHEMA,
        },
      },
    },
    education: {
      type: "array",
      description: "One item per education entry found in the CV text, most recent first.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["degree", "school", ...Object.keys(EXTRACTED_DATE_FIELDS_JSON_SCHEMA)],
        properties: {
          degree: { type: "string" },
          school: { type: "string" },
          ...EXTRACTED_DATE_FIELDS_JSON_SCHEMA,
        },
      },
    },
    skills: {
      type: "array",
      description: "Skills mentioned in the CV text.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "level"],
        properties: {
          name: { type: "string" },
          level: {
            type: "integer",
            enum: [1, 2, 3, 4, 5],
            description: "Your best estimate of proficiency from how the CV describes it, 1 (basic) to 5 (expert).",
          },
        },
      },
    },
  },
} as const;

const EXTRACT_SYSTEM_PROMPT = `You are the same panel of three hiring experts who produced the CV evaluation report for this candidate — a resume writer, a career coach, and a recruiter. You already told them exactly what needs to change. Now you write it.

This time the candidate's CV arrives as plain text extracted from a PDF, not as structured data, so you have two jobs in one shot: transcribe it into structured fields, and rewrite the two places where wording is the actual problem.

WHAT YOU TRANSCRIBE, EXACTLY AS WRITTEN
Personal info (name, email, phone, city, LinkedIn), and for every work experience and education entry: the employer or school name, the title or degree, the city, and the dates. Copy these exactly as they appear in the source text. Never guess, complete, or correct a name or date you're not sure about — if something is genuinely ambiguous or missing, leave it out rather than invent a plausible-looking value.

WHAT YOU REWRITE
Only two things: the profile summary, and each work experience entry's bullet points (its description). Apply the RAT framework: keep Responsibility and Accomplishment distinct, lead with ownership verbs (led, built, delivered, established), cut passive phrasing like "responsible for" or "helped with". Address the specific critical gaps and priority actions from the evaluation report you already produced for this exact CV and role — you are fixing the problems you already found, not starting over.

EVERY ROLE WITH SOURCE CONTENT GETS REWRITTEN, EVEN THE ONES THAT LOOK LESS RELEVANT
The evaluation report judges the CV against this one job, and that's correct for the report. It is not license to write a thin or empty description for an earlier role just because it doesn't look like a direct match to this job. A candidate who is now a VP of Engineering was once a Principal Engineer or an Engineering Manager, and that history is exactly where a reader finds the depth and range that make the current seniority credible; dropping it reads as a thinner career, not a sharper one. If the source text has real bullets or descriptive content for an entry, rewrite it the same way you'd rewrite any other: find the responsibility and accomplishment already there that reads as transferable value for this specific job (technical judgment, scope of ownership, people or budget managed, decisions that held up, problems solved under real constraints) and put that framing front and center. The goal is never to invent relevance that isn't there; it's to surface the relevance that already is there but is buried in the wrong words.

THE ONE RULE THAT MATTERS MOST
Never invent a fact. Every number, outcome, tool, team size, or responsibility you write must already exist somewhere in the original text, or be a direct, defensible restatement of something that does. If the text doesn't say how many people someone managed, you don't get to say five. Fabricating experience is worse than a weak bullet; it would make this CV dishonest in exactly the way the evaluation report was written to catch in someone else's CV. This includes older roles that genuinely have no bullets in the source, which happens often on real CVs that condense early-career history down to a title and dates: if there's truly nothing to work with for an entry, set its description to null. That null is reserved strictly for "the source gives me nothing to rewrite" — never use it as a way of saying "not relevant enough to this job." Perceived low relevance is never a reason for null; only a genuine absence of source content is. Do not pad a null-worthy entry with a generic placeholder line or an empty list just to have something there either — an honest gap is better than a hollow one.

SKILLS
List the skills the CV actually mentions, with your best-effort estimate of proficiency (1-5) based on how the CV describes them. This is an estimate, not a transcribed fact — it's fine to be approximate, since it can be adjusted afterward like any other CV field.

WHAT LANGUAGE YOU WRITE IN
Write the profile summary and every bullet in output_language, the language given to you in the input — this is the candidate's own account language preference, not necessarily the language the source CV text happens to be in. If the source is in a different language, translate that prose faithfully into output_language, but never translate, reword, or alter a proper noun, employer name, tool name, date, or number: those stay exactly as given, verbatim, even inside a translated sentence. This also means personalInfo (name, email, phone, city, LinkedIn) is transcribed as-is, in its original form, never translated — a person's name isn't prose. Translating faithfully is not the same as inventing — the one rule above still applies in full.

Return your answer only as the structured JSON object described by the response schema — no other commentary.`;

export interface GenerateCvFromUploadInput {
  roleTitle: string;
  jobDescription: string;
  cvText: string;
  report: CvOptimizerReportContent;
  /** The account's own locale — what the profile summary and bullets get
   * written in, and what the new CV's own `contentLanguage` (section
   * heading language) gets set to by the caller (see rewrite-cv.ts's
   * `buildCvFromExtraction`) — not detected from the source text. */
  outputLocale: "pt-PT" | "en";
}

/** The "Generate an improved CV" call for a report created from an uploaded
 * PDF (see service.ts's `createRewrite` — this is the branch used when the
 * report has no owned source CV). Extracted identity fields (employer,
 * dates, school...) get written into a real, fully editable CV exactly like
 * any other (see rewrite-cv.ts's `buildCvFromExtraction`) — anything
 * mis-transcribed is a normal edit away from being fixed. */
export async function generateCvFromUpload(input: GenerateCvFromUploadInput): Promise<CvOptimizerExtractedCv> {
  return runStructuredCall({
    system: EXTRACT_SYSTEM_PROMPT,
    jsonSchema: EXTRACT_JSON_SCHEMA,
    userContent: {
      role_applied_for: input.roleTitle,
      job_description: input.jobDescription,
      cv_text: input.cvText,
      evaluation_report: input.report,
      output_language: input.outputLocale,
    },
    responseSchema: cvOptimizerExtractedCvSchema,
  });
}
