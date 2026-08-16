import { db } from "../../db.js";
import type { CreateSection, Section, UpdateSection } from "@cv-maker/contracts";
import { enumToDb, enumToDomain } from "../common/enum-map.js";
import { Prisma } from "../../../generated/client/index.js";
import type { Section as PrismaSection } from "../../../generated/client/index.js";

export const SORT_GAP = 1024;

export function sectionToDomain(row: PrismaSection): Section {
  return {
    id: row.id,
    cvId: row.cvId,
    type: enumToDomain(row.type),
    displayName: row.displayName,
    sortOrder: row.sortOrder,
    hidden: row.hidden,
    forcePageBreak: row.forcePageBreak,
    organizeChronologically: row.organizeChronologically,
    deletable: row.deletable,
    settings: (row.settings as Record<string, unknown>) ?? {},
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function listSections(cvId: string) {
  return db.section.findMany({ where: { cvId }, orderBy: { sortOrder: "asc" } });
}

export function findSection(sectionId: string) {
  return db.section.findUnique({ where: { id: sectionId } });
}

/** Idempotent create: a `(cvId, clientRequestId)` replay returns the
 * originally created section instead of creating a duplicate. The happy
 * path checks the ledger first; the transaction+unique-constraint combo
 * below is what makes two *concurrent* first-time requests for the same
 * key safe too (only one wins the insert, the loser reads back the winner's
 * row) — see features/14, features/15. */
export async function createSectionIdempotent(
  cvId: string,
  input: CreateSection,
): Promise<Section> {
  const existingRequest = await db.sectionCreationRequest.findUnique({
    where: { cvId_clientRequestId: { cvId, clientRequestId: input.clientRequestId } },
  });
  if (existingRequest) {
    const section = await db.section.findUnique({ where: { id: existingRequest.sectionId } });
    if (section) return sectionToDomain(section);
  }

  try {
    const section = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const agg = await tx.section.aggregate({ where: { cvId }, _max: { sortOrder: true } });
      const sortOrder = (agg._max.sortOrder ?? 0) + SORT_GAP;
      const created = await tx.section.create({
        data: {
          cvId,
          type: enumToDb(input.type),
          displayName: input.displayName ?? null,
          sortOrder,
          deletable: true,
        },
      });
      await tx.sectionCreationRequest.create({
        data: { cvId, clientRequestId: input.clientRequestId, sectionId: created.id },
      });
      return created;
    });
    return sectionToDomain(section);
  } catch (err) {
    // Lost a concurrent race for the same idempotency key: the transaction
    // above rolled back entirely (including the Section insert), so read
    // back whichever request won.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const winning = await db.sectionCreationRequest.findUnique({
        where: { cvId_clientRequestId: { cvId, clientRequestId: input.clientRequestId } },
      });
      if (winning) {
        const section = await db.section.findUnique({ where: { id: winning.sectionId } });
        if (section) return sectionToDomain(section);
      }
    }
    throw err;
  }
}

export async function updateSection(sectionId: string, input: UpdateSection) {
  const data: Record<string, unknown> = {};
  if ("displayName" in input) data.displayName = input.displayName;
  if ("hidden" in input) data.hidden = input.hidden;
  if ("forcePageBreak" in input) data.forcePageBreak = input.forcePageBreak;
  if ("organizeChronologically" in input) data.organizeChronologically = input.organizeChronologically;
  if ("settings" in input) data.settings = input.settings as Prisma.InputJsonValue;
  const row = await db.section.update({ where: { id: sectionId }, data });
  return sectionToDomain(row);
}

export function deleteSection(sectionId: string) {
  return db.section.delete({ where: { id: sectionId } });
}

export async function reorderSections(cvId: string, orderedSectionIds: string[]) {
  await db.$transaction(
    orderedSectionIds.map((id, index) =>
      db.section.update({ where: { id }, data: { sortOrder: (index + 1) * SORT_GAP } }),
    ),
  );
  const rows = await listSections(cvId);
  return rows.map(sectionToDomain);
}
