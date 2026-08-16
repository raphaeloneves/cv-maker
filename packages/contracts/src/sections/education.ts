import { z } from "zod";
import { timelineEntryBaseSchema } from "./timeline-entry.js";

/** features/06-education-qualifications.md. No structured grade/GPA field by
 * design — grading scales vary too much by country; use `description` for that. */
export const educationEntrySchema = timelineEntryBaseSchema.extend({
  degree: z.string().trim().min(1).max(200),
  school: z.string().trim().min(1).max(200),
});
export type EducationEntry = z.infer<typeof educationEntrySchema>;

export const upsertEducationEntrySchema = educationEntrySchema.omit({
  id: true,
  sectionId: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
});
export type UpsertEducationEntry = z.infer<typeof upsertEducationEntrySchema>;
