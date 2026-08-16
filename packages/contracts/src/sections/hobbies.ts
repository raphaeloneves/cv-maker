import { z } from "zod";

/** features/09-hobbies-interests.md. Deliberately one hobby per entry (not a
 * single comma-separated textarea) so entries stay independently reorderable
 * and renderable as chips. */
export const hobbyEntrySchema = z.object({
  id: z.string().uuid(),
  sectionId: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  sortOrder: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type HobbyEntry = z.infer<typeof hobbyEntrySchema>;

export const upsertHobbyEntrySchema = hobbyEntrySchema.pick({ name: true });
export type UpsertHobbyEntry = z.infer<typeof upsertHobbyEntrySchema>;
