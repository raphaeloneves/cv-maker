import type { CreateCvInput, UpdateCvInput } from "@cv-maker/contracts";
import { forbidden, notFound } from "../../errors.js";
import * as repo from "./repository.js";

export async function listCvs(userId: string) {
  const cvs = await repo.listCvsForUser(userId);
  return cvs.map(repo.cvToDomain);
}

export async function getOwnedCv(cvId: string, userId: string) {
  const cv = await repo.findCvById(cvId);
  if (!cv) throw notFound("CV not found");
  if (cv.userId !== userId) throw forbidden("You do not have access to this CV");
  return cv;
}

export async function createCv(userId: string, input: CreateCvInput) {
  const cv = await repo.createCvWithFixedSections({
    userId,
    title: input.title,
    contentLanguage: input.contentLanguage,
  });
  return repo.cvToDomain(cv);
}

export async function getCv(cvId: string, userId: string) {
  const cv = await getOwnedCv(cvId, userId);
  return repo.cvToDomain(cv);
}

export async function updateCv(cvId: string, userId: string, input: UpdateCvInput) {
  await getOwnedCv(cvId, userId);
  const cv = await repo.updateCv(cvId, input);
  return repo.cvToDomain(cv);
}

export async function deleteCv(cvId: string, userId: string) {
  await getOwnedCv(cvId, userId);
  await repo.deleteCv(cvId);
}
