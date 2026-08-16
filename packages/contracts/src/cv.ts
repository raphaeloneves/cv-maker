import { z } from "zod";
import { cvContentLanguageSchema, templateIdSchema } from "./enums.js";

/** Top-level CV record. Section content (personal info, sections + their
 * entries) is fetched/mutated through their own dedicated endpoints — this
 * schema is the CV "shell": ownership, language, template selection. */
export const cvSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  contentLanguage: cvContentLanguageSchema,
  templateId: templateIdSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Cv = z.infer<typeof cvSchema>;

export const createCvSchema = z.object({
  title: z.string().trim().min(1).max(160).default("Untitled CV"),
  contentLanguage: cvContentLanguageSchema.default("pt-PT"),
});
export type CreateCvInput = z.infer<typeof createCvSchema>;

export const updateCvSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  contentLanguage: cvContentLanguageSchema.optional(),
  templateId: templateIdSchema.optional(),
});
export type UpdateCvInput = z.infer<typeof updateCvSchema>;
