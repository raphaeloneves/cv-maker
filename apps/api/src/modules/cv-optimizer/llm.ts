import Anthropic from "@anthropic-ai/sdk";
import {
  computePanelScorePercent,
  computeVerdictFromPanelScore,
  cvOptimizerReportContentSchema,
  type CvOptimizerReportContent,
} from "@cv-maker/contracts";
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

/** Fixed order `panelScores` must come back in — same order the prompt
 * introduces the three panelists in, so "one per role" is easy for Claude
 * to satisfy and easy for `computePanelScorePercent` to trust positionally. */
const PANEL_ROLES = ["resume_writer", "career_coach", "recruiter"] as const;

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
    "panelScores",
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
      // No `minItems`/`maxItems` — the Anthropic API rejects any array
      // length constraint other than 0 or 1 (400: "minItems values other
      // than 0 or 1 are not supported"), so "exactly six" can only live in
      // the description below. `cvOptimizerReportContentSchema.objections`
      // enforces the real length server-side after the fact.
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
          actionItems: {
            type: "array",
            items: { type: "string" },
            description:
              "0-2 items, narrow and specific to THIS objection only. Empty for a clean pass. See 'HOW FIXES ARE DIVIDED ACROSS THE REPORT' below — priorityActions is the deduplicated, ranked list; don't repeat one of its entries here.",
          },
        },
      },
    },
    // Deliberately generated *after* `framework`/`objections`, not before —
    // structured outputs fill fields in schema property order, so each
    // panelist scores with the full six-objection analysis already done,
    // not as a first impression that analysis then has to justify.
    panelScores: {
      type: "array",
      // See the `objections` comment above — same array-length API
      // restriction, same server-side enforcement instead
      // (`cvOptimizerPanelScoreSchema` array is `.length(3)`).
      description:
        `Exactly three items, one per panelist, in this exact order: ${PANEL_ROLES.join(", ")}. There is no verdict field: the actual pass/reject line is computed afterward from these three numbers, not decided by you directly.`,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["role", "score", "rationale"],
        properties: {
          role: { type: "string", enum: [...PANEL_ROLES] },
          // No `minimum`/`maximum` here — the Anthropic API rejects those on
          // an `integer`-typed schema property (400: "not supported").
          // 0-100 is enforced by `cvOptimizerPanelScoreSchema` right after
          // parsing instead; the description is the only guardrail Claude
          // itself sees.
          score: {
            type: "integer",
            description: "This panelist's own holistic 0-100 read of the CV against this job — a gut professional call, not a tally of the six objections.",
          },
          rationale: { type: "string", description: "One or two sentences, in this panelist's own voice, on why they landed there." },
        },
      },
    },
    verdictReasoning: {
      type: "string",
      description:
        "Two to four sentences giving the real impression this CV leaves after the five-second scan — who this person reads as, whether the first bullets land, whether the career story tracks, whether the scale is obvious. Never a tally of which objections were pass/partial/reject, never a number, never a citation of a scoring rule — just the lived read. Roughly: panel scores averaging 70+ reads as a pass, below that reads as a reject, so write in whichever register your own three scores actually landed in.",
    },
    criticalGaps: {
      type: "array",
      // See the `objections` comment above — same array-length API
      // restriction; `cvOptimizerReportContentSchema` enforces 3-5 server-side.
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
      description:
        "3-6 items, ranked highest-impact first — the one deduplicated to-do list a candidate should actually work through. Not a rollup of every objection's own actionItems: if two objections point at the same underlying problem, that's one entry here, not two. See 'HOW FIXES ARE DIVIDED ACROSS THE REPORT' below.",
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
        "Prose, not a new list — points back at whichever priorityActions items matter most, never introduces a fix that isn't already there. If pass: what would take this CV from good enough to exceptional. If reject: which one or two priorityActions items are the fundamental blockers to fix first.",
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

Score each one specifically against this job, not in the abstract. For each objection: decide pass, partial, or reject; write one plain sentence for the scorecard; then a fuller two to four sentence analysis; then quote the actual CV lines that back your call; then, at most two, the concrete changes that would fix THIS objection specifically — leave that list empty for a clean pass.

HOW FIXES ARE DIVIDED ACROSS THE REPORT
Three fields carry fixes, and each has exactly one job. Getting this right is what makes a report feel thorough instead of repetitive:
- Each objection's own action items (above): narrow, tactical, specific to that one objection, at most two, empty for a clean pass. This is local detail, not the plan.
- priorityActions (schema field, later): the single ranked, deduplicated to-do list, three to six items, highest-impact first. This is THE plan — the one thing a candidate should actually work through. If two or three objections are all really symptoms of the same underlying problem (say, wasting_time, signal_or_noise, and right_scale are all hurt by one vague, metric-free summary), that is one priorityActions entry naming the real fix, not three separate ones repeating each other in different words. Before you finalize this list, reread every objection's own action items and drop or merge anything you'd just be repeating.
- nextSteps (schema field, at the end): prose, not a new list. Point back at whichever priorityActions items matter most; don't introduce a fix here that isn't already on that list.
More distinct, real problems are worth surfacing than fewer — six objections each flagging something genuinely different is not "too many fixes." The failure mode to avoid is the same fix showing up three times in three different sections, which reads as padding, not thoroughness.

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

EACH PANELIST'S OWN SCORE
After the six objections are scored, step out of the shared scorecard for a moment and answer as yourself. You are three different professionals who read CVs for a living in three different ways: the resume writer notices wording, structure, and whether the document itself does its job; the career coach reads for trajectory, positioning, and whether this person is telling their own story well; the recruiter reads for risk, fit, and whether they'd stake their reputation on this candidate with the hiring manager. Given everything you just found, each of you gives your own honest 0-100 read of how this CV would actually fare for this exact job, plus one or two sentences of why, in your own voice. These three numbers do not have to agree with each other, and they are not a mechanical average of the six objection statuses — they are each panelist's real, holistic judgment call, the number they'd actually put in front of a client. A panel that's genuinely split (one confident, two skeptical) should produce genuinely split numbers, not three copies of a compromise.

HOW THE VERDICT GETS DECIDED
There is no verdict field for you to fill in. The three panel scores above are combined into one number after you respond, and that number alone decides pass or reject — this removes the failure mode where a written verdict and a written scorecard could quietly disagree with each other. Your job is only to make each of the three scores an honest, defensible number and to write verdictReasoning as the real, lived impression the CV leaves, in whichever direction your own scores actually point. Don't hedge a low score with reasoning that sounds like a pass, and don't undersell a high score with reasoning that sounds like a reject — say what you actually saw.

Writing verdictReasoning is not the same task as scoring. A real recruiter doesn't reject a CV by announcing "two objections were partial, therefore reject" — they reject it because of what they actually saw: the summary didn't say who this person was, the first bullet buried the impact, the story had an unexplained jump, whatever it actually was. Go back to THE FIVE SECOND SCAN above and write verdictReasoning as that lived read: the real impression the CV leaves in the first few seconds, in the same plain, specific voice as the rest of this report. Never name an objection key, never mention "partial" or "reject" counts, never cite a score or a scoring rule — that arithmetic is handled elsewhere, and repeating it back is not reasoning, it's bookkeeping.

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

  // Claude's raw JSON has no `verdict` field (see REPORT_JSON_SCHEMA/
  // SYSTEM_PROMPT's "HOW THE VERDICT GETS DECIDED") — compute it here, from
  // the three panel scores it did return, before validating the full
  // contract shape below. This is what makes "a good-looking score next to
  // a Reject stamp" structurally impossible: the verdict is derived from
  // the same number the UI displays, not a second opinion that can drift.
  const panelScores = (parsedJson as { panelScores?: unknown }).panelScores;
  const score = computePanelScorePercent(cvOptimizerReportContentSchema.shape.panelScores.parse(panelScores));
  const withVerdict = { ...(parsedJson as Record<string, unknown>), verdict: computeVerdictFromPanelScore(score) };

  // Defense in depth: `output_config.format` constrains the shape Claude
  // returns, but this is still the boundary of trusted data — parse it
  // through the same schema the rest of the app types against.
  return cvOptimizerReportContentSchema.parse(withVerdict);
}
