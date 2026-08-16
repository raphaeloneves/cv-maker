import type { BuilderLocale, CvContentLanguage } from "@cv-maker/contracts";

/** Every Prisma enum in this schema uses SCREAMING_SNAKE_CASE values whose
 * lowercased form exactly matches the corresponding `packages/contracts`
 * zod-enum value (e.g. `SectionType.WORK_EXPERIENCE` <-> `"work_experience"`,
 * `TemplateId.HELSINKI` <-> `"helsinki"`, `DateGranularity.FULL` <-> `"full"`)
 * — so a single generic lower/upper-case pair covers all of them. The one
 * exception is BuilderLocale/CvContentLanguage (`PT_PT` <-> `"pt-PT"`, a
 * hyphenated, mixed-case domain value), handled by its own explicit mapper
 * below. */
export function enumToDomain<T extends string>(value: string): T {
  return value.toLowerCase() as T;
}

export function enumToDb<T extends string>(value: string): T {
  return value.toUpperCase() as T;
}

type PrismaLocale = "PT_PT" | "EN";

export function localeToDomain(value: PrismaLocale): BuilderLocale {
  return value === "EN" ? "en" : "pt-PT";
}

export function localeToDb(value: BuilderLocale | CvContentLanguage): PrismaLocale {
  return value === "en" ? "EN" : "PT_PT";
}
