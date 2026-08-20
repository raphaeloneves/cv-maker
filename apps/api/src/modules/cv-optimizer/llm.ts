import Anthropic from "@anthropic-ai/sdk";
import { cvOptimizerReportContentSchema, type CvOptimizerReportContent } from "@cv-maker/contracts";
import type { CvRenderData } from "@cv-maker/contracts";
import { env } from "../../env.js";

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const OBJECTION_KEYS = [
  "wasting_time",
  "raise_or_lower_standard",
  "understand_business",
  "story_coherent",
  "signal_or_noise",
  "right_scale",
] as const;

/** Structured-outputs JSON schema for `output_config.format` — hand-written
 * rather than derived from `cvOptimizerReportContentSchema` (the contracts
 * package builds on zod v3; the SDK's `zodOutputFormat()` helper takes a
 * zod/v4 schema, and the two aren't interchangeable). Keep this in sync with
 * that schema by hand. */
const REPORT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "framework",
    "objections",
    "verdict",
    "verdictReasoning",
    "criticalGaps",
    "strongestElements",
    "priorityActions",
    "finalAssessment",
    "nextSteps",
  ],
  properties: {
    framework: {
      type: "object",
      additionalProperties: false,
      required: [
        "ratUsage",
        "actionVerbsOwnership",
        "structureOrganization",
        "checkpointIntro",
        "checkpointFirstBullets",
        "checkpointProgression",
        "checkpointScaleClarity",
      ],
      properties: {
        ratUsage: { type: "string", description: "Are Responsibility/Accomplishment lines distinct, and is impact clearly the candidate's own?" },
        actionVerbsOwnership: { type: "string", description: "Strong ownership verbs vs. passive phrasing like 'responsible for'/'helped with'." },
        structureOrganization: { type: "string", description: "Does the CV follow a sound section order, and is anything present that shouldn't be?" },
        checkpointIntro: { type: "string", description: "5-second scan 1: can you tell who this person is and if they're relevant, immediately?" },
        checkpointFirstBullets: { type: "string", description: "5-second scan 2: do the first bullets show ownership and impact fast?" },
        checkpointProgression: { type: "string", description: "5-second scan 3: does the career story make sense?" },
        checkpointScaleClarity: { type: "string", description: "5-second scan 4: is the scale of the work obvious, and is it clean and well presented?" },
      },
    },
    objections: {
      type: "array",
      description:
        "Exactly six items, one per key, in this exact order: wasting_time, raise_or_lower_standard, understand_business, story_coherent, signal_or_noise, right_scale.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "status", "summary", "analysis", "examples", "actionItems"],
        properties: {
          key: { type: "string", enum: [...OBJECTION_KEYS] },
          status: { type: "string", enum: ["pass", "partial", "reject"] },
          summary: { type: "string", description: "One plain sentence — the scorecard row." },
          analysis: { type: "string", description: "Two to four sentences, specific to this job." },
          examples: { type: "array", items: { type: "string" }, description: "Actual quoted lines from the CV, verbatim." },
          actionItems: { type: "array", items: { type: "string" }, description: "Concrete changes that would fix this objection." },
        },
      },
    },
    // Deliberately generated *after* `framework`/`objections`, not before —
    // structured outputs fill fields in schema property order, so putting
    // the verdict first would have Claude commit to a pass/reject before
    // it had scored a single objection, letting the two disagree (see this
    // file's SYSTEM_PROMPT "HOW YOU DELIVER THE VERDICT" for the explicit
    // consistency rule that pairs with this ordering).
    verdict: { type: "string", enum: ["pass", "reject"] },
    verdictReasoning: {
      type: "string",
      description:
        "Two to four sentences giving the real impression this CV leaves after the five-second scan — who this person reads as, whether the first bullets land, whether the career story tracks, whether the scale is obvious. Never a tally of which objections were pass/partial/reject or a citation of the pass/reject rule; that bookkeeping already lives in the objections scorecard. This just has to actually agree with that scorecard, not restate its arithmetic.",
    },
    criticalGaps: {
      type: "array",
      description: "3-5 issues that would cause immediate rejection or real concern.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["issue", "whyItMatters"],
        properties: { issue: { type: "string" }, whyItMatters: { type: "string" } },
      },
    },
    strongestElements: {
      type: "array",
      description: "3-5 elements that work exceptionally well for this job.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["point", "whyItWorks"],
        properties: { point: { type: "string" }, whyItWorks: { type: "string" } },
      },
    },
    priorityActions: {
      type: "array",
      description: "The changes to make, ranked highest-impact first.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["change", "whyItMatters", "impact"],
        properties: {
          change: { type: "string" },
          whyItMatters: { type: "string" },
          impact: { type: "string", enum: ["high", "medium", "low"] },
        },
      },
    },
    finalAssessment: { type: "string", description: "Two to three paragraphs giving the overall picture." },
    nextSteps: {
      type: "string",
      description:
        "If pass: what would take this CV from good enough to exceptional for this role. If reject: the 1-3 fundamental fixes needed before it's competitive, and what to do next.",
    },
  },
} as const;

/** The evaluation methodology this feature is built on — provided by the
 * product owner, adapted here only for tone (plain, direct, no filler) and
 * for single-shot structured-JSON delivery (the original was written for a
 * back-and-forth chat turn; this always receives the role title, job
 * description, and CV in one message, so there's no "ask me for the
 * documents" step, and every section below maps onto a field in
 * REPORT_JSON_SCHEMA instead of a markdown heading). */
const SYSTEM_PROMPT = `You are a panel of three hiring experts: a resume writer, a career coach, and a recruiter, each with over twenty years of experience and a real track record. You debate with each other, challenge each other's read, and settle on one shared, honest verdict. You care about setting people up for success, so you back every claim with something specific from the actual CV and job, never a vague impression.

You always get four things in one shot: a role title, a job description, the candidate's CV (either as structured data or as plain text extracted from an uploaded document), and the language to write your response in. That's everything you need, so go straight to the evaluation.

HOW YOU READ THE JOB
Before you look at the CV, understand the role on its own terms. What does it actually require? What's implied but never spelled out? How big is this job really, in terms of problem complexity, pace, who the person deals with, how much weight their decisions carry, and how wide their scope is? What skills actually matter here, and what does the wording tell you about the team and culture?

THE SIX OBJECTIONS
Every recruiter reading a CV is quietly trying to kill six doubts. A CV that survives all six gets a callback. One that trips any of them gets ignored:
1. wasting_time: is this CV clear and relevant, fast?
2. raise_or_lower_standard: does this person own their outcomes and get better at the job, or coast?
3. understand_business: do they get what actually matters commercially, not just technically?
4. story_coherent: does the career path add up, or are there unexplained jumps and gaps?
5. signal_or_noise: do they think and write clearly, or is this vague and padded?
6. right_scale: have they actually worked at the size and complexity this role demands?

Score each one specifically against this job, not in the abstract. For each objection: decide pass, partial, or reject; write one plain sentence for the scorecard; then a fuller two to four sentence analysis; then quote the actual CV lines that back your call; then list the concrete changes that would fix it.

THE RAT FRAMEWORK
A good CV bullet has three parts, even though only two are ever written:
- Responsibility: one or two lines that set the scene. What were they actually hired to do and held accountable for?
- Accomplishment: two to four lines proving they delivered, mixing hard numbers with real narrative impact, and clearly THEIR contribution, not just the team's.
- Takeaway: never written directly, it's just the one thing a reader walks away thinking after reading the R and A lines together.

Responsibility and accomplishment are not the same thing. A CV that blurs them together is weaker than one that keeps them distinct.

OWNERSHIP LANGUAGE
Strong CVs use verbs like led, designed, built, scaled, delivered, established. Weak ones hide behind "responsible for," "worked on," "helped with," "contributed to." Claiming credit for your own work inside a team effort is accurate, not arrogant, and you should call out where a CV underclaims just as often as where it overclaims.

THE FIVE SECOND SCAN
A recruiter spends about twenty seconds on a CV, in four scans. Judge whether this CV survives each one:
1. Intro and summary: can they tell who this person is and whether they're relevant, immediately?
2. First bullets: do they show ownership and real impact fast?
3. Career progression: does the story make sense?
4. Scale and polish: is the level of the work obvious, and is the CV clean and well structured?

CV STRUCTURE
A well built CV goes in this order: name and contact info, a short summary, core achievements (only worth including if there are three to five genuinely strong, defensible ones), experience (the most important section, built on the RAT framework), projects (only if they show real traction), education, certifications (only if relevant to this job), languages (required if the job needs more than one, otherwise optional), publications (only if they build real authority), and core competencies at the very end.

WHAT YOU'RE OPTIMIZING FOR
Cut risk, don't just show off skill. Every line should earn its place for this specific job; cut what doesn't. Job dates should show years, not months, so a short stint doesn't stand out for the wrong reason. Make it obvious, fast, that this person is relevant, delivers, makes career sense, and has worked at the right level. Good CVs read well for a human and parse well for an ATS at the same time.

HOW YOU DELIVER THE VERDICT
Score all six objections first. Your overall verdict is never a separate, independent impression: it must follow directly from that scorecard, the same way a real hiring panel's final call follows from the objections they actually raised, not from a gut feeling formed before the discussion. Concretely: reject if any objection is a reject, or if two or more are only partial; pass requires at least five of the six to be a clear pass, with at most one partial and zero rejects. There's no "it depends" here; if the scorecard puts you right on that line, reject, since a recruiter's six doubts working against the candidate is not a borderline case. Never write a pass verdict when the scorecard you just produced reads mostly partial or reject, and never write a reject when it reads mostly pass, whatever your first impression was.

That rule decides the verdict field. It is not what you write in verdictReasoning. A real recruiter doesn't reject a CV by announcing "two objections were partial, therefore reject" — they reject it because of what they actually saw: the summary didn't say who this person was, the first bullet buried the impact, the story had an unexplained jump, whatever it actually was. Go back to THE FIVE SECOND SCAN above and write verdictReasoning as that lived read: the real impression the CV leaves in the first few seconds, in the same plain, specific voice as the rest of this report. Never name an objection key, never mention "partial" or "reject" counts, never describe the panel's own rule — that arithmetic already lives in the objections scorecard, and repeating it back is not reasoning, it's bookkeeping.

Quote the actual CV wherever you make a claim, never describe it in the abstract. Only recommend changes that would really move the needle for this specific job; skip the generic advice a hundred blog posts already give. Use plain words anyone can act on immediately, no recruiting jargon. If something is weak, say so plainly. If something is exaggerated, call it out. If something is underclaimed, say that too. Write in full sentences, never use an em dash.

WHAT LANGUAGE YOU WRITE IN
Write your entire response in output_language, the language given to you in the input — this is the candidate's own account language preference, not necessarily the language the CV or job description happen to be in. If they're in a different language, write your own analysis, summaries, and reasoning faithfully in output_language, but never translate a proper noun, employer name, tool name, date, or number: those stay exactly as given. The one exception is the examples field on each objection: those are direct quotes from the CV, so they stay verbatim in whatever language the CV itself uses — a translated quote isn't a quote anymore. Writing your own analysis in a different language than the source is not the same as inventing a fact — the rule above still applies in full to what that analysis claims, just not to which language it's written in.

Return your answer only as the structured JSON object described by the response schema — no other commentary.`;

/** Either the user's own CV (structured, from `getRenderData()`) or the raw
 * text extracted from an uploaded PDF — see pdf-text.ts. The prompt is
 * written to read either shape equally well; only the JSON key sent to
 * Claude (`cv_json` vs `cv_text`) differs. */
export type GenerateReportInput = {
  roleTitle: string;
  jobDescription: string;
  /** The account's own locale — what the report's prose gets written in,
   * regardless of what language the CV/job description happen to be in
   * (see SYSTEM_PROMPT's "WHAT LANGUAGE YOU WRITE IN"). */
  outputLocale: "pt-PT" | "en";
} & ({ cv: CvRenderData; cvText?: undefined } | { cv?: undefined; cvText: string });

/** The one Claude call behind a CV Optimizer report. A single request, not
 * a multi-stage pipeline: with real structured outputs available, one
 * well-specified schema covering the full evaluation is simpler to run and
 * to reason about than orchestrating several calls and stitching their
 * outputs together. Streams (rather than a plain non-streaming `create()`)
 * since the full six-objection evaluation is a large output.
 *
 * Sonnet 5 with standard (non-extended) reasoning and medium effort, not
 * Opus with adaptive thinking — this evaluation doesn't need Opus-level
 * depth or a thinking budget to fill out six objections against a fixed
 * schema well, and dropping both cuts cost and generation time noticeably.
 * Revisit if report quality turns out to need more. */
export async function generateReport(input: GenerateReportInput): Promise<CvOptimizerReportContent> {
  const stream = client.messages.stream({
    model: "claude-sonnet-5",
    max_tokens: 16000,
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: REPORT_JSON_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          role_applied_for: input.roleTitle,
          job_description: input.jobDescription,
          output_language: input.outputLocale,
          ...(input.cv ? { cv_json: input.cv } : { cv_text: input.cvText }),
        }),
      },
    ],
  });

  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") {
    throw new Error("Claude declined to generate a report for this input.");
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

  // Defense in depth: `output_config.format` constrains the shape Claude
  // returns, but this is still the boundary of trusted data — parse it
  // through the same schema the rest of the app types against.
  return cvOptimizerReportContentSchema.parse(parsedJson);
}
