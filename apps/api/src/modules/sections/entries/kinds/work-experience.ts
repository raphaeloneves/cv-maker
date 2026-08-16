import { upsertWorkExperienceEntrySchema } from "@cv-maker/contracts";
import type { WorkExperienceEntry } from "@cv-maker/contracts";
import { db } from "../../../../db.js";
import type { EntryDelegate, EntryKindConfig } from "../factory.js";
import { columnsToDateRange, dateRangeToColumns } from "../date-mapping.js";

export const workExperienceConfig: EntryKindConfig<
  WorkExperienceEntry,
  typeof upsertWorkExperienceEntrySchema._type
> = {
  urlSegment: "work-experience",
  upsertSchema: upsertWorkExperienceEntrySchema,
  delegate: db.workExperienceEntry as unknown as EntryDelegate,
  toDomain: (row) => ({
    id: row.id as string,
    sectionId: row.sectionId as string,
    title: row.title as string,
    employer: row.employer as string,
    city: row.city as string | null,
    dateRange: columnsToDateRange(row as never),
    description: row.description as string | null,
    sortOrder: row.sortOrder as number,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  }),
  toWriteData: (input) => {
    const data: Record<string, unknown> = {};
    if ("title" in input) data.title = input.title;
    if ("employer" in input) data.employer = input.employer;
    if ("city" in input) data.city = input.city ?? null;
    if ("description" in input) data.description = input.description ?? null;
    if (input.dateRange) Object.assign(data, dateRangeToColumns(input.dateRange));
    return data;
  },
};
