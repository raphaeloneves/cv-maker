import { z } from "zod";

/** Earliest year selectable across the app. Kept as a named constant (not
 * hardcoded per-field) so every date picker — DOB, work experience, education,
 * courses — stays in sync. Fixes features/01's arbitrary DOB year ceiling and
 * features/05's hardcoded-to-1948 start year: both should instead be computed
 * as `CURRENT_YEAR - N` at render time on the frontend. */
export const EARLIEST_SELECTABLE_YEAR = 1900;

const yearSchema = z.number().int().min(EARLIEST_SELECTABLE_YEAR).max(2100);
const monthSchema = z.number().int().min(1).max(12);

/** A single date endpoint (a start date, or a dated — non-"present" — end date).
 * A discriminated union on `granularity` rather than a `.refine()`-checked flat
 * object: `month` is statically required when granularity is "full" and
 * statically absent otherwise, so consumers get real type narrowing instead
 * of a runtime-only check. `year` is always present — needed for chronological
 * sorting regardless of display granularity, including "hidden". */
export const datePointSchema = z.discriminatedUnion("granularity", [
  z.object({ granularity: z.literal("full"), month: monthSchema, year: yearSchema }),
  z.object({ granularity: z.literal("year_only"), year: yearSchema }),
  z.object({ granularity: z.literal("hidden"), year: yearSchema }),
]);
export type DatePoint = z.infer<typeof datePointSchema>;

function datePointMonth(d: DatePoint): number | null {
  return d.granularity === "full" ? d.month : null;
}

/** A timeline entry's end date. `isPresent` is a first-class discriminant —
 * never a sentinel year — so "currently employed here" sorts correctly and
 * renders as "Present" without a fake end date (features/05-work-experience.md). */
export const dateEndSchema = z.union([
  z.object({ isPresent: z.literal(true) }),
  z.object({
    isPresent: z.literal(false),
    granularity: z.literal("full"),
    month: monthSchema,
    year: yearSchema,
  }),
  z.object({
    isPresent: z.literal(false),
    granularity: z.literal("year_only"),
    year: yearSchema,
  }),
  z.object({
    isPresent: z.literal(false),
    granularity: z.literal("hidden"),
    year: yearSchema,
  }),
]);
export type DateEnd = z.infer<typeof dateEndSchema>;

/** Note: reversed/overlapping ranges are intentionally NOT rejected here.
 * Per features/05 and features/11, a naive implementation blocking on this is
 * a UX trap (courses can legitimately be same-month start/end; some users
 * enter data out of order while drafting). Validity is enforced structurally
 * (start/end shape, required fields); "does this look backwards" is a
 * non-blocking warning surfaced by `isDateRangeSuspicious` below, for the
 * frontend to show as an inline hint — never as a submit blocker. */
export const dateRangeSchema = z.object({
  start: datePointSchema,
  end: dateEndSchema,
});
export type DateRange = z.infer<typeof dateRangeSchema>;

/** Non-blocking heuristic: does this range look reversed? Used to render a
 * soft warning, never to reject a save. */
export function isDateRangeSuspicious(range: DateRange): boolean {
  const end = range.end;
  if (end.isPresent) return false;
  if (range.start.year !== end.year) return range.start.year > end.year;
  const startMonth = datePointMonth(range.start);
  const endMonth = end.granularity === "full" ? end.month : null;
  if (startMonth === null || endMonth === null) return false;
  return startMonth > endMonth;
}
