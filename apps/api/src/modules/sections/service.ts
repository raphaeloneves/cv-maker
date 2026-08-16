import type { CreateSection, ReorderSections, UpdateSection } from "@cv-maker/contracts";
import { conflict } from "../../errors.js";
import * as repo from "./repository.js";
import { assertCvOwnership, getOwnedSection } from "./section-access.js";

export async function listSections(cvId: string, userId: string) {
  await assertCvOwnership(cvId, userId);
  const rows = await repo.listSections(cvId);
  return rows.map(repo.sectionToDomain);
}

export async function createSection(cvId: string, userId: string, input: CreateSection) {
  await assertCvOwnership(cvId, userId);
  return repo.createSectionIdempotent(cvId, input);
}

export async function updateSection(sectionId: string, userId: string, input: UpdateSection) {
  await getOwnedSection(sectionId, userId);
  return repo.updateSection(sectionId, input);
}

export async function deleteSection(sectionId: string, userId: string) {
  const section = await getOwnedSection(sectionId, userId);
  if (!section.deletable) {
    throw conflict("This section is built-in and cannot be deleted — hide it instead");
  }
  await repo.deleteSection(sectionId);
}

export async function reorderSections(cvId: string, userId: string, input: ReorderSections) {
  await assertCvOwnership(cvId, userId);
  return repo.reorderSections(cvId, input.orderedSectionIds);
}
