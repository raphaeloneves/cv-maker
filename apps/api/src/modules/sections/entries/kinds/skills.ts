import { upsertSkillEntrySchema } from "@cv-maker/contracts";
import type { SkillEntry } from "@cv-maker/contracts";
import { db } from "../../../../db.js";
import type { EntryDelegate, EntryKindConfig } from "../factory.js";

export const skillsConfig: EntryKindConfig<SkillEntry, typeof upsertSkillEntrySchema._type> = {
  urlSegment: "skills",
  upsertSchema: upsertSkillEntrySchema,
  delegate: db.skillEntry as unknown as EntryDelegate,
  toDomain: (row) => ({
    id: row.id as string,
    sectionId: row.sectionId as string,
    name: row.name as string,
    level: row.level as number,
    sortOrder: row.sortOrder as number,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  }),
  toWriteData: (input) => {
    const data: Record<string, unknown> = {};
    if ("name" in input) data.name = input.name;
    if ("level" in input) data.level = input.level;
    return data;
  },
};
