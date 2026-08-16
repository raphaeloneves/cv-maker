import { z } from "zod";
import { timelineEntryBaseSchema } from "./timeline-entry.js";

/** features/05-work-experience.md */
export const workExperienceEntrySchema = timelineEntryBaseSchema.extend({
  title: z.string().trim().min(1).max(200),
  employer: z.string().trim().min(1).max(200),
});
export type WorkExperienceEntry = z.infer<typeof workExperienceEntrySchema>;

export const upsertWorkExperienceEntrySchema = workExperienceEntrySchema.omit({
  id: true,
  sectionId: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
});
export type UpsertWorkExperienceEntry = z.infer<typeof upsertWorkExperienceEntrySchema>;
