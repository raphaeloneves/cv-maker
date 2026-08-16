import type { DateRange } from "@cv-maker/contracts";

/** Sort key for "most recent first" ordering — a `Present` end date always
 * sorts as the most recent thing possible (never a sentinel year), matching
 * the discriminated `DateEnd` model in packages/contracts/src/common/date.ts. */
function rangeSortKey(range: DateRange): number {
  if (range.end.isPresent) return Number.POSITIVE_INFINITY;
  const endMonth = range.end.granularity === "full" ? range.end.month : 12;
  return range.end.year * 12 + endMonth;
}

/** Used when a section has `organizeChronologically: true` (features/15) —
 * entries are always re-sorted by date regardless of stored `sortOrder`,
 * and manual drag-reorder has no effect while the flag is on. */
export function sortByDateRangeDesc<T extends { dateRange: DateRange }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => rangeSortKey(b.dateRange) - rangeSortKey(a.dateRange));
}
