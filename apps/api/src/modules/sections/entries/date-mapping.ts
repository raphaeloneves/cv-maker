import type { DateEnd, DatePoint, DateRange } from "@cv-maker/contracts";
import { enumToDb } from "../../common/enum-map.js";

/** Shared start/end <-> flat-column mapping for the three timeline-entry
 * kinds (work-experience, education, courses) — see
 * `WorkExperienceEntry`/`EducationEntry`/`CourseEntry` in schema.prisma,
 * which all repeat the same `start*`/`end*` column group documented once
 * there as "features/05, 06, 11". Keeping this in one place is what lets
 * the 3 timeline kinds reuse the same entry-factory adapter shape instead
 * of re-deriving this mapping three times. */
export function dateRangeToColumns(range: DateRange): Record<string, unknown> {
  const { start, end } = range;
  const startGranularity = enumToDb(start.granularity);
  const startMonth = start.granularity === "full" ? start.month : null;

  if (end.isPresent) {
    return {
      startGranularity,
      startMonth,
      startYear: start.year,
      endIsPresent: true,
      endGranularity: null,
      endMonth: null,
      endYear: null,
    };
  }

  return {
    startGranularity,
    startMonth,
    startYear: start.year,
    endIsPresent: false,
    endGranularity: enumToDb(end.granularity),
    endMonth: end.granularity === "full" ? end.month : null,
    endYear: end.year,
  };
}

function columnsToStart(row: {
  startGranularity: string;
  startMonth: number | null;
  startYear: number;
}): DatePoint {
  if (row.startGranularity === "FULL") {
    return { granularity: "full", month: row.startMonth as number, year: row.startYear };
  }
  if (row.startGranularity === "YEAR_ONLY") {
    return { granularity: "year_only", year: row.startYear };
  }
  return { granularity: "hidden", year: row.startYear };
}

function columnsToEnd(row: {
  endIsPresent: boolean;
  endGranularity: string | null;
  endMonth: number | null;
  endYear: number | null;
}): DateEnd {
  if (row.endIsPresent) return { isPresent: true };
  if (row.endGranularity === "FULL") {
    return {
      isPresent: false,
      granularity: "full",
      month: row.endMonth as number,
      year: row.endYear as number,
    };
  }
  if (row.endGranularity === "YEAR_ONLY") {
    return { isPresent: false, granularity: "year_only", year: row.endYear as number };
  }
  return { isPresent: false, granularity: "hidden", year: row.endYear as number };
}

export function columnsToDateRange(row: {
  startGranularity: string;
  startMonth: number | null;
  startYear: number;
  endIsPresent: boolean;
  endGranularity: string | null;
  endMonth: number | null;
  endYear: number | null;
}): DateRange {
  return { start: columnsToStart(row), end: columnsToEnd(row) };
}
