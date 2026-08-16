import { z } from "zod";
import { sectionTypeSchema } from "../enums.js";

/** Shared shape/behavior for every section, built-in or user-added.
 * See features/15-section-management.md — one settings model for all of them. */
export const sectionSchema = z.object({
  id: z.string().uuid(),
  cvId: z.string().uuid(),
  type: sectionTypeSchema,
  /** Overrides the locale-derived default title (see section-titles.ts). Once
   * set, it wins verbatim regardless of later cvContentLanguage changes. */
  displayName: z.string().trim().min(1).max(120).nullable(),
  sortOrder: z.number(),
  hidden: z.boolean(),
  forcePageBreak: z.boolean(),
  /** Only meaningful for sections with dated entries (experience/education/courses).
   * When true, entries are always rendered sorted by date (most-recent/"present" first)
   * and manual drag-reorder is disabled in the UI for that section. */
  organizeChronologically: z.boolean(),
  /** True for the 6 fixed built-in sections — they can be hidden but not deleted. */
  deletable: z.boolean(),
  /** Section-type-specific flags that don't warrant their own column, e.g.
   * references' `showAvailableUponRequest` (features/10). */
  settings: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Section = z.infer<typeof sectionSchema>;

export const updateSectionSchema = sectionSchema
  .pick({
    displayName: true,
    hidden: true,
    forcePageBreak: true,
    organizeChronologically: true,
    settings: true,
  })
  .partial();
export type UpdateSection = z.infer<typeof updateSectionSchema>;

export const reorderSectionsSchema = z.object({
  /** Ordered list of section ids, top to bottom. Server recomputes gap-based
   * sortOrder values from this order — see features/15's reorder-efficiency note. */
  orderedSectionIds: z.array(z.string().uuid()).min(1),
});
export type ReorderSections = z.infer<typeof reorderSectionsSchema>;

/** Body for POST /cvs/:cvId/sections. `clientRequestId` is a client-generated
 * idempotency key: submitting the same key twice (e.g. a duplicate double-click
 * or a leaked keystroke re-submit) returns the original section instead of
 * creating a second one. This is the direct fix for the reference product's
 * confirmed duplicate-section-creation defect (features/14, features/15). */
export const createSectionSchema = z.object({
  type: sectionTypeSchema,
  displayName: z.string().trim().min(1).max(120).nullable().optional(),
  clientRequestId: z.string().uuid(),
});
export type CreateSection = z.infer<typeof createSectionSchema>;
