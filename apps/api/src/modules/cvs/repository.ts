import { db } from "../../db.js";
import { FIXED_SECTION_TYPES } from "@cv-maker/contracts";
import type { Cv } from "@cv-maker/contracts";
import { enumToDb, enumToDomain, localeToDb, localeToDomain } from "../common/enum-map.js";
import type { Cv as PrismaCv, Prisma } from "../../../generated/client/index.js";

export const SECTION_SORT_GAP = 1024;

export function cvToDomain(cv: PrismaCv): Cv {
  return {
    id: cv.id,
    userId: cv.userId,
    title: cv.title,
    contentLanguage: localeToDomain(cv.contentLanguage) as Cv["contentLanguage"],
    templateId: enumToDomain<Cv["templateId"]>(cv.templateId),
    createdAt: cv.createdAt.toISOString(),
    updatedAt: cv.updatedAt.toISOString(),
  };
}

export function listCvsForUser(userId: string) {
  return db.cv.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
}

export function findCvById(cvId: string) {
  return db.cv.findUnique({ where: { id: cvId } });
}

/** Creates the CV plus its 6 fixed, non-deletable sections in one
 * transaction (docs/api-routes.md: profile_summary, work_experience,
 * education, skills, hobbies, references, in that sortOrder). */
export async function createCvWithFixedSections(params: {
  userId: string;
  title: string;
  contentLanguage: "pt-PT" | "en";
}) {
  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const cv = await tx.cv.create({
      data: {
        userId: params.userId,
        title: params.title,
        contentLanguage: localeToDb(params.contentLanguage),
      },
    });
    await tx.section.createMany({
      data: FIXED_SECTION_TYPES.map((type, index) => ({
        cvId: cv.id,
        type: enumToDb(type),
        sortOrder: (index + 1) * SECTION_SORT_GAP,
        hidden: false,
        deletable: false,
      })),
    });
    return cv;
  });
}

export function updateCv(
  cvId: string,
  data: Partial<{ title: string; contentLanguage: "pt-PT" | "en"; templateId: string }>,
) {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.contentLanguage !== undefined) updateData.contentLanguage = localeToDb(data.contentLanguage);
  if (data.templateId !== undefined) updateData.templateId = enumToDb(data.templateId);
  return db.cv.update({ where: { id: cvId }, data: updateData as Prisma.CvUpdateInput });
}

export function deleteCv(cvId: string) {
  return db.cv.delete({ where: { id: cvId } });
}
