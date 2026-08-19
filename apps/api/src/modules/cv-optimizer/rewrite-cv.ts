import { randomUUID } from "node:crypto";
import type {
  CvOptimizerExtractedCv,
  CvOptimizerRewriteContent,
  DateRange,
  PersonalInfo,
  RenderSection,
} from "@cv-maker/contracts";
import { db } from "../../db.js";
import { enumToDb, enumToDomain } from "../common/enum-map.js";
import type { TemplateId as PrismaTemplateId } from "../../../generated/client/index.js";
import { createCvWithFixedSections } from "../cvs/repository.js";
import { buildRenderSection } from "../cv-render-data/service.js";
import { findPersonalInfoByCv } from "../personal-info/repository.js";
import { personalInfoToDomain } from "../personal-info/mapper.js";
import { upsertPersonalInfo } from "../personal-info/service.js";
import * as sectionsRepo from "../sections/repository.js";
import { ENTRY_SORT_GAP } from "../sections/entries/factory.js";
import { columnsToDateRange } from "../sections/entries/date-mapping.js";
import { workExperienceConfig } from "../sections/entries/kinds/work-experience.js";
import { educationConfig } from "../sections/entries/kinds/education.js";
import { coursesConfig } from "../sections/entries/kinds/courses.js";
import { skillsConfig } from "../sections/entries/kinds/skills.js";
import { languagesConfig } from "../sections/entries/kinds/languages.js";
import { hobbiesConfig } from "../sections/entries/kinds/hobbies.js";
import { referencesConfig } from "../sections/entries/kinds/references.js";

/** Every section of a CV, entries included — unlike `getRenderData`, not
 * filtered to `hidden: false`. The rewrite pipeline is duplicating a CV, not
 * rendering one, so a section the user hid should stay hidden on the copy,
 * not vanish from it. */
async function getFullCvSections(cvId: string): Promise<RenderSection[]> {
  const rows = await db.section.findMany({ where: { cvId }, orderBy: { sortOrder: "asc" } });
  return Promise.all(rows.map(buildRenderSection));
}

async function getFullPersonalInfo(cvId: string): Promise<PersonalInfo | null> {
  const row = await findPersonalInfoByCv(cvId);
  return row ? personalInfoToDomain(row) : null;
}

export interface BuildRewrittenCvParams {
  userId: string;
  sourceCvId: string;
  sourceTemplateId: string;
  sourceContentLanguage: "pt-PT" | "en";
  newTitle: string;
  rewrite: CvOptimizerRewriteContent;
}

/** Builds a brand new, real `Cv` (appears in the dashboard, editable and
 * exportable like any other) from an existing one plus a rewrite's content:
 * every section and entry is carried over unchanged except the profile
 * summary and each work experience entry's description, which are replaced
 * with the rewrite's versions. This is a duplicate-then-patch, not a
 * from-scratch generation — identity-bearing fields (employer, title,
 * dates, education, skills, everything else) are never touched by the LLM
 * output at all, only copied. Returns the new CV's id. */
export async function buildRewrittenCv(params: BuildRewrittenCvParams): Promise<string> {
  const { userId, sourceCvId, sourceTemplateId, sourceContentLanguage, newTitle, rewrite } = params;

  const [sections, personalInfo] = await Promise.all([
    getFullCvSections(sourceCvId),
    getFullPersonalInfo(sourceCvId),
  ]);

  const newCv = await createCvWithFixedSections({
    userId,
    title: newTitle,
    contentLanguage: sourceContentLanguage,
  });
  // createCvWithFixedSections defaults templateId to Helsinki — carry over
  // the source CV's actual template so the new CV continues it rather than
  // silently resetting the choice.
  await db.cv.update({
    where: { id: newCv.id },
    data: { templateId: enumToDb<PrismaTemplateId>(sourceTemplateId) },
  });

  if (personalInfo) {
    await upsertPersonalInfo(newCv.id, personalInfo);
  }

  const newSections = await sectionsRepo.listSections(newCv.id);
  const newSectionIdByType = new Map(newSections.map((s) => [enumToDomain<string>(s.type), s.id]));
  const rewriteByEntryId = new Map(rewrite.workExperience.map((w) => [w.entryId, w.description]));

  for (const section of sections) {
    let targetSectionId = newSectionIdByType.get(section.type);
    if (!targetSectionId) {
      const created = await sectionsRepo.createSectionIdempotent(newCv.id, {
        type: section.type,
        displayName: section.displayName,
        clientRequestId: randomUUID(),
      });
      targetSectionId = created.id;
    }

    await sectionsRepo.updateSection(targetSectionId, {
      displayName: section.displayName,
      hidden: section.hidden,
      forcePageBreak: section.forcePageBreak,
      organizeChronologically: section.organizeChronologically,
      settings: section.settings,
    });

    switch (section.type) {
      case "profile_summary":
        await db.section.update({
          where: { id: targetSectionId },
          data: { freeformDescription: rewrite.profileSummary },
        });
        break;

      case "achievements":
      case "publications":
      case "custom":
        await db.section.update({
          where: { id: targetSectionId },
          data: { freeformDescription: section.freeformDescription ?? null },
        });
        break;

      case "work_experience":
        for (const entry of section.workExperienceEntries ?? []) {
          // Fall back to the original description if Claude didn't return
          // this entryId at all, or returned it blank — an entry that
          // already has real content should never end up emptier after a
          // rewrite than it started.
          const rewritten = rewriteByEntryId.get(entry.id);
          const description = rewritten && rewritten.trim() ? rewritten : entry.description;
          await workExperienceConfig.delegate.create({
            data: {
              sectionId: targetSectionId,
              sortOrder: entry.sortOrder,
              ...workExperienceConfig.toWriteData({ ...entry, description }),
            },
          });
        }
        break;

      case "education":
        for (const entry of section.educationEntries ?? []) {
          await educationConfig.delegate.create({
            data: { sectionId: targetSectionId, sortOrder: entry.sortOrder, ...educationConfig.toWriteData(entry) },
          });
        }
        break;

      case "courses":
        for (const entry of section.courseEntries ?? []) {
          await coursesConfig.delegate.create({
            data: { sectionId: targetSectionId, sortOrder: entry.sortOrder, ...coursesConfig.toWriteData(entry) },
          });
        }
        break;

      case "skills":
        for (const entry of section.skillEntries ?? []) {
          await skillsConfig.delegate.create({
            data: { sectionId: targetSectionId, sortOrder: entry.sortOrder, ...skillsConfig.toWriteData(entry) },
          });
        }
        break;

      case "languages":
        for (const entry of section.languageEntries ?? []) {
          await languagesConfig.delegate.create({
            data: { sectionId: targetSectionId, sortOrder: entry.sortOrder, ...languagesConfig.toWriteData(entry) },
          });
        }
        break;

      case "hobbies":
        for (const entry of section.hobbyEntries ?? []) {
          await hobbiesConfig.delegate.create({
            data: { sectionId: targetSectionId, sortOrder: entry.sortOrder, ...hobbiesConfig.toWriteData(entry) },
          });
        }
        break;

      case "references":
        for (const entry of section.referenceEntries ?? []) {
          await referencesConfig.delegate.create({
            data: { sectionId: targetSectionId, sortOrder: entry.sortOrder, ...referencesConfig.toWriteData(entry) },
          });
        }
        break;
    }
  }

  return newCv.id;
}

/** Extracted date fields (see cv-optimizer.ts's `extractedDateFieldsSchema`)
 * -> the app's own `DateRange` shape, reusing the exact conversion the rest
 * of the app trusts (`columnsToDateRange`) rather than re-deriving the
 * granularity rules here. `startMonth`/`endMonth` being null is exactly
 * "year only" in both places. */
function extractedDatesToRange(fields: {
  startMonth: number | null;
  startYear: number;
  endIsPresent: boolean;
  endMonth: number | null;
  endYear: number | null;
}): DateRange {
  return columnsToDateRange({
    startGranularity: fields.startMonth != null ? "FULL" : "YEAR_ONLY",
    startMonth: fields.startMonth,
    startYear: fields.startYear,
    endIsPresent: fields.endIsPresent,
    endGranularity: fields.endIsPresent ? null : fields.endMonth != null ? "FULL" : "YEAR_ONLY",
    endMonth: fields.endMonth,
    endYear: fields.endYear,
  });
}

export interface BuildCvFromExtractionParams {
  userId: string;
  newTitle: string;
  /** The new CV's section-heading language (features/03-internationalization.md)
   * — the requesting user's own account locale, supplied by the caller
   * rather than detected by Claude from the source text. Keeps one thing
   * (the account locale) as the single source of truth for both the
   * generated prose's language and this, instead of asking the model to
   * echo back a value the server already knows. */
  contentLanguage: "pt-PT" | "en";
  extraction: CvOptimizerExtractedCv;
}

/** Builds a brand new, real `Cv` from an upload-path report's extraction —
 * unlike `buildRewrittenCv` above, there's no original CV to copy the rest
 * of the content from, so only the sections Claude was asked to extract
 * (profile summary, work experience, education, skills) get populated;
 * everything else starts empty, exactly as it would for any CV a user
 * builds by hand — and is just as editable afterward. Returns the new CV's
 * id. */
export async function buildCvFromExtraction(params: BuildCvFromExtractionParams): Promise<string> {
  const { userId, newTitle, contentLanguage, extraction } = params;

  const newCv = await createCvWithFixedSections({
    userId,
    title: newTitle,
    contentLanguage,
  });

  await upsertPersonalInfo(newCv.id, {
    firstName: extraction.personalInfo.firstName,
    lastName: extraction.personalInfo.lastName,
    email: extraction.personalInfo.email,
    phone: extraction.personalInfo.phone,
    city: extraction.personalInfo.city,
    linkedin: extraction.personalInfo.linkedin,
  });

  const sections = await sectionsRepo.listSections(newCv.id);
  const sectionIdByType = new Map(sections.map((s) => [enumToDomain<string>(s.type), s.id]));

  const profileSummaryId = sectionIdByType.get("profile_summary");
  if (profileSummaryId) {
    await db.section.update({
      where: { id: profileSummaryId },
      data: { freeformDescription: extraction.profileSummary },
    });
  }

  const workExperienceId = sectionIdByType.get("work_experience");
  if (workExperienceId) {
    for (const [index, entry] of extraction.workExperience.entries()) {
      await workExperienceConfig.delegate.create({
        data: {
          sectionId: workExperienceId,
          sortOrder: (index + 1) * ENTRY_SORT_GAP,
          ...workExperienceConfig.toWriteData({
            title: entry.title,
            employer: entry.employer,
            city: entry.city,
            description: entry.description,
            dateRange: extractedDatesToRange(entry),
          }),
        },
      });
    }
  }

  const educationId = sectionIdByType.get("education");
  if (educationId) {
    for (const [index, entry] of extraction.education.entries()) {
      await educationConfig.delegate.create({
        data: {
          sectionId: educationId,
          sortOrder: (index + 1) * ENTRY_SORT_GAP,
          ...educationConfig.toWriteData({
            degree: entry.degree,
            school: entry.school,
            city: null,
            description: null,
            dateRange: extractedDatesToRange(entry),
          }),
        },
      });
    }
  }

  const skillsId = sectionIdByType.get("skills");
  if (skillsId) {
    for (const [index, skill] of extraction.skills.entries()) {
      await skillsConfig.delegate.create({
        data: {
          sectionId: skillsId,
          sortOrder: (index + 1) * ENTRY_SORT_GAP,
          ...skillsConfig.toWriteData({ name: skill.name, level: skill.level }),
        },
      });
    }
  }

  return newCv.id;
}
