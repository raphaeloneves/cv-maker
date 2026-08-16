import { z } from "zod";

/** features/18-export-download.md. Export is always computed fresh from the
 * CV's current data/template/color at request time — never served from a
 * stale cache — and rendered through the exact same component tree as the
 * live preview (packages/cv-render) to guarantee pixel-equivalence. */
export const exportCvResponseMetaSchema = z.object({
  watermarked: z.boolean(),
  pageCount: z.number().int().min(1),
});
export type ExportCvResponseMeta = z.infer<typeof exportCvResponseMetaSchema>;
