import { upsertHobbyEntrySchema } from "@cv-maker/contracts";
import type { HobbyEntry } from "@cv-maker/contracts";
import { db } from "../../../../db.js";
import type { EntryDelegate, EntryKindConfig } from "../factory.js";

export const hobbiesConfig: EntryKindConfig<HobbyEntry, typeof upsertHobbyEntrySchema._type> = {
  urlSegment: "hobbies",
  upsertSchema: upsertHobbyEntrySchema,
  delegate: db.hobbyEntry as unknown as EntryDelegate,
  toDomain: (row) => ({
    id: row.id as string,
    sectionId: row.sectionId as string,
    name: row.name as string,
    sortOrder: row.sortOrder as number,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  }),
  toWriteData: (input) => {
    const data: Record<string, unknown> = {};
    if ("name" in input) data.name = input.name;
    return data;
  },
};
