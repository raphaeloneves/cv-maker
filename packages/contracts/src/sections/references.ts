import { z } from "zod";

/** features/10-references.md. `showAvailableUponRequest` lives in the parent
 * Section's `settings` jsonb (see sections/base.ts) — it's a rendering
 * preference that takes precedence over entries at render/export time, and
 * toggling it must NEVER delete underlying entries. This schema documents the
 * settings shape for that flag specifically. */
export const referencesSectionSettingsSchema = z.object({
  showAvailableUponRequest: z.boolean().default(false),
});
export type ReferencesSectionSettings = z.infer<typeof referencesSectionSettingsSchema>;

export const referenceEntrySchema = z.object({
  id: z.string().uuid(),
  sectionId: z.string().uuid(),
  companyName: z.string().trim().min(1).max(200),
  contactPerson: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(50).nullable(),
  email: z.string().trim().email().max(254).nullable(),
  sortOrder: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ReferenceEntry = z.infer<typeof referenceEntrySchema>;

export const upsertReferenceEntrySchema = referenceEntrySchema.pick({
  companyName: true,
  contactPerson: true,
  phone: true,
  email: true,
});
export type UpsertReferenceEntry = z.infer<typeof upsertReferenceEntrySchema>;
