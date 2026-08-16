import type { CvRenderData, RenderSection, UserRole } from "@cv-maker/contracts";
import { defaultColorFor, hasActiveEntitlement } from "@cv-maker/contracts";
import { db } from "../../db.js";
import { getOwnedCv } from "../cvs/service.js";
import { cvToDomain } from "../cvs/repository.js";
import { findPersonalInfoByCv } from "../personal-info/repository.js";
import { personalInfoToDomain } from "../personal-info/mapper.js";
import { sectionToDomain } from "../sections/repository.js";
import { sortByDateRangeDesc } from "../sections/entries/chronological-sort.js";
import { workExperienceConfig } from "../sections/entries/kinds/work-experience.js";
import { educationConfig } from "../sections/entries/kinds/education.js";
import { coursesConfig } from "../sections/entries/kinds/courses.js";
import { skillsConfig } from "../sections/entries/kinds/skills.js";
import { languagesConfig } from "../sections/entries/kinds/languages.js";
import { hobbiesConfig } from "../sections/entries/kinds/hobbies.js";
import { referencesConfig } from "../sections/entries/kinds/references.js";
import { findSubscriptionByUserId, subscriptionToDomain } from "../billing/repository.js";

type SectionRow = Awaited<ReturnType<typeof db.section.findMany>>[number];

async function buildRenderSection(section: SectionRow): Promise<RenderSection> {
  const base = sectionToDomain(section);
  const sectionId = section.id;

  switch (base.type) {
    case "work_experience": {
      const rows = await db.workExperienceEntry.findMany({
        where: { sectionId },
        orderBy: { sortOrder: "asc" },
      });
      let entries = rows.map(workExperienceConfig.toDomain);
      if (section.organizeChronologically) entries = sortByDateRangeDesc(entries);
      return { ...base, workExperienceEntries: entries };
    }
    case "education": {
      const rows = await db.educationEntry.findMany({
        where: { sectionId },
        orderBy: { sortOrder: "asc" },
      });
      let entries = rows.map(educationConfig.toDomain);
      if (section.organizeChronologically) entries = sortByDateRangeDesc(entries);
      return { ...base, educationEntries: entries };
    }
    case "courses": {
      const rows = await db.courseEntry.findMany({
        where: { sectionId },
        orderBy: { sortOrder: "asc" },
      });
      let entries = rows.map(coursesConfig.toDomain);
      if (section.organizeChronologically) entries = sortByDateRangeDesc(entries);
      return { ...base, courseEntries: entries };
    }
    case "skills": {
      const rows = await db.skillEntry.findMany({
        where: { sectionId },
        orderBy: { sortOrder: "asc" },
      });
      return { ...base, skillEntries: rows.map(skillsConfig.toDomain) };
    }
    case "languages": {
      const rows = await db.languageEntry.findMany({
        where: { sectionId },
        orderBy: { sortOrder: "asc" },
      });
      return { ...base, languageEntries: rows.map(languagesConfig.toDomain) };
    }
    case "hobbies": {
      const rows = await db.hobbyEntry.findMany({
        where: { sectionId },
        orderBy: { sortOrder: "asc" },
      });
      return { ...base, hobbyEntries: rows.map(hobbiesConfig.toDomain) };
    }
    case "references": {
      const rows = await db.referenceEntry.findMany({
        where: { sectionId },
        orderBy: { sortOrder: "asc" },
      });
      return { ...base, referenceEntries: rows.map(referencesConfig.toDomain) };
    }
    // profile_summary / achievements / publications / custom
    default:
      return { ...base, freeformDescription: section.freeformDescription };
  }
}

export async function getRenderData(
  cvId: string,
  userId: string,
  userRole: UserRole,
): Promise<CvRenderData> {
  const cvRow = await getOwnedCv(cvId, userId);
  const cv = cvToDomain(cvRow);

  const [personalInfoRow, sectionRows, preference, subscriptionRow] = await Promise.all([
    findPersonalInfoByCv(cvId),
    db.section.findMany({
      where: { cvId, hidden: false },
      orderBy: { sortOrder: "asc" },
    }),
    db.cvTemplatePreference.findFirst({
      where: { cvId, templateId: cvRow.templateId },
    }),
    findSubscriptionByUserId(userId),
  ]);

  const sections = await Promise.all(sectionRows.map(buildRenderSection));
  const subscription = subscriptionRow ? subscriptionToDomain(subscriptionRow) : null;

  return {
    contentLanguage: cv.contentLanguage,
    templateId: cv.templateId,
    accentColor: preference?.color ?? defaultColorFor(cv.templateId),
    watermarked: !hasActiveEntitlement(subscription, userRole),
    personalInfo: personalInfoRow ? personalInfoToDomain(personalInfoRow) : null,
    sections,
  };
}
