import { z } from "zod";

/** Academy (post-auth learning section) — a curated slice of the founder's
 * career-coaching classroom, split into 2 lessons free for every account and
 * two Pro-only groups. Module/lesson *definitions* (titles, order, grouping,
 * body copy) are static content in `apps/api/src/modules/academy/content.ts`,
 * not a DB table — these schemas describe that static content plus the one
 * thing that IS per-user and persisted: completion state. See
 * `hasActiveEntitlement` in ./billing.js for the gating check `locked` below
 * reflects. */

export const academyLessonSummarySchema = z.object({
  slug: z.string(),
  title: z.string(),
  isFree: z.boolean(),
  /** True when this lesson is Pro-only and the caller isn't entitled. Always
   * false for free lessons. Computed server-side, never stored. */
  locked: z.boolean(),
  completed: z.boolean(),
});
export type AcademyLessonSummary = z.infer<typeof academyLessonSummarySchema>;

export const academyGroupSchema = z.object({
  slug: z.string(),
  title: z.string(),
  lessons: z.array(academyLessonSummarySchema),
});
export type AcademyGroup = z.infer<typeof academyGroupSchema>;

/** The sidebar's full shape: the 2 free lessons listed on their own (no group
 * header, matching the source classroom's own layout), followed by the two
 * Pro-only groups. */
export const academyOutlineSchema = z.object({
  standaloneLessons: z.array(academyLessonSummarySchema),
  groups: z.array(academyGroupSchema),
});
export type AcademyOutline = z.infer<typeof academyOutlineSchema>;

/** Most lessons are long-form text; the entire "LinkedIn Profile
 * Optimisation" group is video-only in the source classroom with no real
 * video wired in yet — `video` bodies render a placeholder until one is
 * supplied. */
export const academyLessonBodySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), markdown: z.string() }),
  z.object({ kind: z.literal("video"), placeholder: z.literal(true) }),
]);
export type AcademyLessonBody = z.infer<typeof academyLessonBodySchema>;

export const academyLessonContentSchema = academyLessonSummarySchema.extend({
  body: academyLessonBodySchema,
});
export type AcademyLessonContent = z.infer<typeof academyLessonContentSchema>;
