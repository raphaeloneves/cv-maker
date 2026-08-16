import { z } from "zod";

/** features/12-achievements.md, features/13-publications.md, features/14-custom-sections.md.
 * One shared primitive for all three "freeform" section types — a single
 * rich-text blob, no repeatable structured entries — rather than three
 * near-identical implementations. Content lives directly on the parent
 * Section row (see sections/base.ts), keyed by the section's `type`.
 *
 * Publications ships freeform for v1, matching the reference product, though
 * a structured title/venue/year/link shape was flagged as a plausible future
 * enhancement for an academic/researcher audience — deliberately deferred. */
export const freeformSectionContentSchema = z.object({
  description: z.string().max(20_000).nullable(),
});
export type FreeformSectionContent = z.infer<typeof freeformSectionContentSchema>;
