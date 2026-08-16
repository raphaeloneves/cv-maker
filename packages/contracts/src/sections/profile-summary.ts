import { z } from "zod";

/** features/04-profile-summary.md. Always present on a CV (not deletable,
 * only hideable — enforced by `section.deletable = false` for this type). */
export const profileSummaryContentSchema = z.object({
  description: z.string().max(20_000).nullable(),
});
export type ProfileSummaryContent = z.infer<typeof profileSummaryContentSchema>;
