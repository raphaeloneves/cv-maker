import { z } from "zod";
import { timelineEntryBaseSchema } from "./timeline-entry.js";

/** features/11-courses-certifications.md. `credentialUrl` is an addition beyond
 * the reference product — an explicit first-class field for a verification link,
 * flagged there as a worthwhile opportunity. */
export const courseEntrySchema = timelineEntryBaseSchema.extend({
  courseName: z.string().trim().min(1).max(200),
  institution: z.string().trim().min(1).max(200),
  credentialUrl: z.string().trim().url().max(500).nullable().optional(),
});
export type CourseEntry = z.infer<typeof courseEntrySchema>;

export const upsertCourseEntrySchema = courseEntrySchema.omit({
  id: true,
  sectionId: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
});
export type UpsertCourseEntry = z.infer<typeof upsertCourseEntrySchema>;
