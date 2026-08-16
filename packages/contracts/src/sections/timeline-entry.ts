import { z } from "zod";
import { dateRangeSchema } from "../common/date.js";

/** Shared base for the three "repeatable timeline entry" sections — work
 * experience, education, courses (features/05, 06, 11). Each domain module
 * extends this with its own two headline fields (e.g. title/employer vs
 * degree/school vs courseName/institution) rather than reimplementing the
 * date/description/ordering machinery three times. */
export const timelineEntryBaseSchema = z.object({
  id: z.string().uuid(),
  sectionId: z.string().uuid(),
  city: z.string().trim().max(200).nullable(),
  dateRange: dateRangeSchema,
  /** Rich text (Bold/Italic/Underline + lists only — see features/04).
   * Sanitized server-side before persisting; this HTML round-trips into PDF export. */
  description: z.string().max(20_000).nullable(),
  sortOrder: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
