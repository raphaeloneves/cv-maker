import { upsertLanguageEntrySchema } from "@cv-maker/contracts";
import type { CefrLevel, DescriptiveLevel, LanguageEntry, LanguageProficiency } from "@cv-maker/contracts";
import { db } from "../../../../db.js";
import type { EntryDelegate, EntryKindConfig } from "../factory.js";
import { enumToDb } from "../../../common/enum-map.js";

function proficiencyToDomain(scale: string, level: string): LanguageProficiency {
  if (scale === "CEFR") return { scale: "cefr", level: level as CefrLevel };
  return { scale: "descriptive", level: level as DescriptiveLevel };
}

export const languagesConfig: EntryKindConfig<
  LanguageEntry,
  typeof upsertLanguageEntrySchema._type
> = {
  urlSegment: "languages",
  upsertSchema: upsertLanguageEntrySchema,
  delegate: db.languageEntry as unknown as EntryDelegate,
  toDomain: (row) => ({
    id: row.id as string,
    sectionId: row.sectionId as string,
    languageName: row.languageName as string,
    proficiency: proficiencyToDomain(row.scale as string, row.level as string),
    sortOrder: row.sortOrder as number,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  }),
  toWriteData: (input) => {
    const data: Record<string, unknown> = {};
    if ("languageName" in input) data.languageName = input.languageName;
    if (input.proficiency) {
      data.scale = enumToDb(input.proficiency.scale);
      data.level = input.proficiency.level;
    }
    return data;
  },
};
