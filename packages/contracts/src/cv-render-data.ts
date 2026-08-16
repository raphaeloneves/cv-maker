import { z } from "zod";
import { personalInfoSchema } from "./personal-info.js";
import { sectionSchema } from "./sections/base.js";
import { workExperienceEntrySchema } from "./sections/work-experience.js";
import { educationEntrySchema } from "./sections/education.js";
import { courseEntrySchema } from "./sections/courses.js";
import { skillEntrySchema } from "./sections/skills.js";
import { languageEntrySchema } from "./sections/languages.js";
import { hobbyEntrySchema } from "./sections/hobbies.js";
import { referenceEntrySchema } from "./sections/references.js";
import { cvContentLanguageSchema, templateIdSchema } from "./enums.js";

/** One section plus its resolved entries/content, shaped so packages/cv-render
 * can lay it out without knowing about the API layer. Exactly one of the
 * entry arrays / `freeformDescription` is populated, matching `section.type`. */
export const renderSectionSchema = sectionSchema.extend({
  workExperienceEntries: z.array(workExperienceEntrySchema).optional(),
  educationEntries: z.array(educationEntrySchema).optional(),
  courseEntries: z.array(courseEntrySchema).optional(),
  skillEntries: z.array(skillEntrySchema).optional(),
  languageEntries: z.array(languageEntrySchema).optional(),
  hobbyEntries: z.array(hobbyEntrySchema).optional(),
  referenceEntries: z.array(referenceEntrySchema).optional(),
  freeformDescription: z.string().nullable().optional(),
});
export type RenderSection = z.infer<typeof renderSectionSchema>;

/** The full payload needed to render a CV — used identically by the
 * browser-side live preview (apps/web) and the server-side PDF export
 * (apps/api), both going through packages/cv-render's <CvDocument>. Hidden
 * sections are already excluded here; the caller decides once, not the
 * renderer. */
export const cvRenderDataSchema = z.object({
  contentLanguage: cvContentLanguageSchema,
  templateId: templateIdSchema,
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  watermarked: z.boolean(),
  personalInfo: personalInfoSchema.nullable(),
  sections: z.array(renderSectionSchema),
});
export type CvRenderData = z.infer<typeof cvRenderDataSchema>;
