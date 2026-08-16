import { z } from "zod";

/** features/08-languages.md. Two comparable but genuinely distinct proficiency
 * frameworks, always stored with an explicit `scale` discriminant — never
 * inferred from a numeric range, which is the reference product's fragile
 * implicit convention. The UI groups these under two labeled optgroups
 * instead of the reference's single flat 11-option dropdown. */
export const descriptiveLevelSchema = z.enum([
  "native",
  "highly_proficient",
  "advanced",
  "good_working",
  "working",
]);
export type DescriptiveLevel = z.infer<typeof descriptiveLevelSchema>;

export const cefrLevelSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
export type CefrLevel = z.infer<typeof cefrLevelSchema>;

export const languageProficiencySchema = z.discriminatedUnion("scale", [
  z.object({ scale: z.literal("descriptive"), level: descriptiveLevelSchema }),
  z.object({ scale: z.literal("cefr"), level: cefrLevelSchema }),
]);
export type LanguageProficiency = z.infer<typeof languageProficiencySchema>;

export const languageEntrySchema = z.object({
  id: z.string().uuid(),
  sectionId: z.string().uuid(),
  languageName: z.string().trim().min(1).max(120),
  proficiency: languageProficiencySchema,
  sortOrder: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type LanguageEntry = z.infer<typeof languageEntrySchema>;

export const upsertLanguageEntrySchema = languageEntrySchema.pick({
  languageName: true,
  proficiency: true,
});
export type UpsertLanguageEntry = z.infer<typeof upsertLanguageEntrySchema>;

const DESCRIPTIVE_PERCENT: Record<DescriptiveLevel, number> = {
  native: 100,
  highly_proficient: 80,
  advanced: 60,
  good_working: 40,
  working: 20,
};

const CEFR_PERCENT: Record<CefrLevel, number> = {
  C2: 100,
  C1: 85,
  B2: 65,
  B1: 45,
  A2: 25,
  A1: 10,
};

/** One explicit, tested mapping onto a 0-100 continuum, for meter-style
 * rendering — replaces the reference product's implicit "numeric ranges
 * happen not to collide" trick with a documented, single source of truth. */
export function languageProficiencyPercent(p: LanguageProficiency): number {
  return p.scale === "descriptive" ? DESCRIPTIVE_PERCENT[p.level] : CEFR_PERCENT[p.level];
}
