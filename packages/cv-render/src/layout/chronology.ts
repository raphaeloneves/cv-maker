import type { DateRange, RenderSection } from "@cv-maker/contracts";

/** A single, testable sort key: `year * 12 + month`, with a mid-year (6)
 * fallback when granularity omits the month ("year_only"/"hidden" both only
 * ever display a year — see contracts/src/common/date.ts). */
function dateKey(year: number, month: number | null): number {
  return year * 12 + (month ?? 6);
}

function startKey(range: DateRange): number {
  return dateKey(range.start.year, range.start.granularity === "full" ? range.start.month : null);
}

function endKey(range: DateRange): number {
  if (range.end.isPresent) return Number.POSITIVE_INFINITY;
  return dateKey(range.end.year, range.end.granularity === "full" ? range.end.month : null);
}

/** Most-recent/"present" first. Ties on end date break on start date, also
 * descending — a longer, earlier-started entry with the same end date sorts
 * after a shorter, later-started one, matching how most CVs are read. */
export function compareDateRangesDescending(a: DateRange, b: DateRange): number {
  const endDiff = endKey(b) - endKey(a);
  if (endDiff !== 0) return endDiff;
  return startKey(b) - startKey(a);
}

function sortByDateRangeDescending<T extends { dateRange: DateRange }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => compareDateRangesDescending(a.dateRange, b.dateRange));
}

/** Centralizes chronological ordering in the one place both the browser
 * preview and the server-side PDF export go through, rather than trusting
 * every caller to have pre-sorted entries. A no-op (returns `section`
 * unchanged) when `organizeChronologically` is false. Applies to the three
 * dated/repeatable entry kinds the flag is meaningful for (features/05, 06, 11) —
 * a section only ever populates the one entry array matching its `type`, so
 * the other two are always already-undefined no-ops. */
export function sortSectionChronologically(section: RenderSection): RenderSection {
  if (!section.organizeChronologically) return section;

  const next: RenderSection = { ...section };
  if (next.workExperienceEntries) {
    next.workExperienceEntries = sortByDateRangeDescending(next.workExperienceEntries);
  }
  if (next.educationEntries) {
    next.educationEntries = sortByDateRangeDescending(next.educationEntries);
  }
  if (next.courseEntries) {
    next.courseEntries = sortByDateRangeDescending(next.courseEntries);
  }
  return next;
}
