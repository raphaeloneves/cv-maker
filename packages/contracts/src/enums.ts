import { z } from "zod";

/** The two independent language axes — see features/03-internationalization.md.
 * `BuilderLocale` controls the app chrome (buttons, labels, tips).
 * `CvContentLanguage` controls the language of section headings baked into the CV itself.
 * They are never conflated: changing one must never change the other. */
export const builderLocaleSchema = z.enum(["pt-PT", "en"]);
export type BuilderLocale = z.infer<typeof builderLocaleSchema>;

export const cvContentLanguageSchema = z.enum(["pt-PT", "en"]);
export type CvContentLanguage = z.infer<typeof cvContentLanguageSchema>;

/** Every section type a CV can contain. The first six are fixed/built-in and
 * cannot be deleted (only hidden) — languages/courses/achievements/publications/custom
 * are added on demand via the "add a section" mechanism. See features/14, 15. */
export const sectionTypeSchema = z.enum([
  "profile_summary",
  "work_experience",
  "education",
  "skills",
  "hobbies",
  "references",
  "languages",
  "courses",
  "achievements",
  "publications",
  "custom",
]);
export type SectionType = z.infer<typeof sectionTypeSchema>;

export const FIXED_SECTION_TYPES: SectionType[] = [
  "profile_summary",
  "work_experience",
  "education",
  "skills",
  "hobbies",
  "references",
];

export const EXTRA_SECTION_TYPES: SectionType[] = [
  "languages",
  "courses",
  "achievements",
  "publications",
  "custom",
];

/** Sections whose body is a single rich-text blob rather than repeatable entries. */
export const FREEFORM_SECTION_TYPES: SectionType[] = ["achievements", "publications", "custom"];

/** How much of a date to show. Per features/05: "full" (month+year), "year_only",
 * or "hidden" (don't show the month at all, still stored for sorting). */
export const dateGranularitySchema = z.enum(["full", "year_only", "hidden"]);
export type DateGranularity = z.infer<typeof dateGranularitySchema>;

/** Language proficiency is deliberately two comparable but distinct scales —
 * see features/08-languages.md. Never inferred from numeric range alone;
 * the scale is always stored explicitly. */
export const languageScaleSchema = z.enum(["descriptive", "cefr"]);
export type LanguageScale = z.infer<typeof languageScaleSchema>;

/** Evenly-spaced 1-5 rank, fixing the reference product's uneven 100/75/50/25/20
 * skill scale (features/07-skills.md). 5 = highest. */
export const skillLevelSchema = z.number().int().min(1).max(5);

/** Gender is an open, inclusive set — fixes the reference product's hard
 * Male/Female binary (features/01-personal-information.md). `selfDescribed` pairs
 * with a free-text field on personal info. */
export const genderSchema = z.enum([
  "female",
  "male",
  "non_binary",
  "self_described",
  "prefer_not_to_say",
]);
export type Gender = z.infer<typeof genderSchema>;

export const subscriptionStatusSchema = z.enum(["none", "active", "canceled", "past_due"]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

/** `admin` bypasses all paywall/entitlement checks regardless of subscription
 * status — used for internal QA/demo accounts (seeded in prisma/seed.ts), not
 * exposed anywhere in the public sign-up flow. See billing.ts:hasActiveEntitlement. */
export const userRoleSchema = z.enum(["user", "admin"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const templateIdSchema = z.enum([
  "helsinki",
  "lisbon",
  "kyoto",
  "denver",
  "marrakech",
  "geneva",
  "porto",
  "faro",
]);
export type TemplateId = z.infer<typeof templateIdSchema>;
