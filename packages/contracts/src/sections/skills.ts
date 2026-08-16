import { z } from "zod";
import { skillLevelSchema } from "../enums.js";

/** features/07-skills.md. `level` is an evenly-spaced 1-5 rank — fixes the
 * reference product's uneven 100/75/50/25/20 scale, which visually collapses
 * its bottom two levels in any meter-style rendering. */
export const skillEntrySchema = z.object({
  id: z.string().uuid(),
  sectionId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  level: skillLevelSchema,
  sortOrder: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type SkillEntry = z.infer<typeof skillEntrySchema>;

export const upsertSkillEntrySchema = skillEntrySchema.pick({ name: true, level: true });
export type UpsertSkillEntry = z.infer<typeof upsertSkillEntrySchema>;
