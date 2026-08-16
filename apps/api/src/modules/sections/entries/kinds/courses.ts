import { upsertCourseEntrySchema } from "@cv-maker/contracts";
import type { CourseEntry } from "@cv-maker/contracts";
import { db } from "../../../../db.js";
import type { EntryDelegate, EntryKindConfig } from "../factory.js";
import { columnsToDateRange, dateRangeToColumns } from "../date-mapping.js";

export const coursesConfig: EntryKindConfig<CourseEntry, typeof upsertCourseEntrySchema._type> = {
  urlSegment: "courses",
  upsertSchema: upsertCourseEntrySchema,
  delegate: db.courseEntry as unknown as EntryDelegate,
  toDomain: (row) => ({
    id: row.id as string,
    sectionId: row.sectionId as string,
    courseName: row.courseName as string,
    institution: row.institution as string,
    credentialUrl: row.credentialUrl as string | null,
    city: row.city as string | null,
    dateRange: columnsToDateRange(row as never),
    description: row.description as string | null,
    sortOrder: row.sortOrder as number,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  }),
  toWriteData: (input) => {
    const data: Record<string, unknown> = {};
    if ("courseName" in input) data.courseName = input.courseName;
    if ("institution" in input) data.institution = input.institution;
    if ("credentialUrl" in input) data.credentialUrl = input.credentialUrl ?? null;
    if ("city" in input) data.city = input.city ?? null;
    if ("description" in input) data.description = input.description ?? null;
    if (input.dateRange) Object.assign(data, dateRangeToColumns(input.dateRange));
    return data;
  },
};
