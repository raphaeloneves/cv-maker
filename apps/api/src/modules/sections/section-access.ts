import { db } from "../../db.js";
import { forbidden, notFound } from "../../errors.js";

/** Sub-resource routes address a section directly (`/sections/:sectionId/...`,
 * no `cvId` in the path — see docs/api-routes.md), so ownership has to be
 * resolved by walking Section -> Cv -> userId. Returns the section row (with
 * its parent `cv` included) once ownership is confirmed. */
export async function getOwnedSection(sectionId: string, userId: string) {
  const section = await db.section.findUnique({
    where: { id: sectionId },
    include: { cv: true },
  });
  if (!section) throw notFound("Section not found");
  if (section.cv.userId !== userId) throw forbidden("You do not have access to this section");
  return section;
}

/** Same check for the `/cvs/:cvId/sections` family, where the CV is already
 * in the path. */
export async function assertCvOwnership(cvId: string, userId: string) {
  const cv = await db.cv.findUnique({ where: { id: cvId } });
  if (!cv) throw notFound("CV not found");
  if (cv.userId !== userId) throw forbidden("You do not have access to this CV");
  return cv;
}
