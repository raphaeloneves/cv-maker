import { upsertEducationEntrySchema } from "@cv-maker/contracts";
import type { EducationEntry } from "@cv-maker/contracts";
import { db } from "../../../../db.js";
import type { EntryDelegate, EntryKindConfig } from "../factory.js";
import { columnsToDateRange, dateRangeToColumns } from "../date-mapping.js";

export const educationConfig: EntryKindConfig<
  EducationEntry,
  typeof upsertEducationEntrySchema._type
> = {
  urlSegment: "education",
  upsertSchema: upsertEducationEntrySchema,
  delegate: db.educationEntry as unknown as EntryDelegate,
  toDomain: (row) => ({
    id: row.id as string,
    sectionId: row.sectionId as string,
    degree: row.degree as string,
    school: row.school as string,
    city: row.city as string | null,
    dateRange: columnsToDateRange(row as never),
    description: row.description as string | null,
    sortOrder: row.sortOrder as number,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  }),
  toWriteData: (input) => {
    const data: Record<string, unknown> = {};
    if ("degree" in input) data.degree = input.degree;
    if ("school" in input) data.school = input.school;
    if ("city" in input) data.city = input.city ?? null;
    if ("description" in input) data.description = input.description ?? null;
    if (input.dateRange) Object.assign(data, dateRangeToColumns(input.dateRange));
    return data;
  },
};
