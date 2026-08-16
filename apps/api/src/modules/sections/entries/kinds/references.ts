import { upsertReferenceEntrySchema } from "@cv-maker/contracts";
import type { ReferenceEntry } from "@cv-maker/contracts";
import { db } from "../../../../db.js";
import type { EntryDelegate, EntryKindConfig } from "../factory.js";

export const referencesConfig: EntryKindConfig<
  ReferenceEntry,
  typeof upsertReferenceEntrySchema._type
> = {
  urlSegment: "references",
  upsertSchema: upsertReferenceEntrySchema,
  delegate: db.referenceEntry as unknown as EntryDelegate,
  toDomain: (row) => ({
    id: row.id as string,
    sectionId: row.sectionId as string,
    companyName: row.companyName as string,
    contactPerson: row.contactPerson as string,
    phone: row.phone as string | null,
    email: row.email as string | null,
    sortOrder: row.sortOrder as number,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  }),
  toWriteData: (input) => {
    const data: Record<string, unknown> = {};
    if ("companyName" in input) data.companyName = input.companyName;
    if ("contactPerson" in input) data.contactPerson = input.contactPerson;
    if ("phone" in input) data.phone = input.phone ?? null;
    if ("email" in input) data.email = input.email ?? null;
    return data;
  },
};
