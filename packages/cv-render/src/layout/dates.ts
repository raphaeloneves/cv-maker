import type { CvContentLanguage, DateEnd, DatePoint, DateRange } from "@cv-maker/contracts";
import { monthName, PRESENT_LABEL } from "./i18n.js";

/** "year_only" and "hidden" both render as just the year — the two options
 * are a deliberate UI nuance (features/05) but collapse to the same display
 * granularity, so there is only one non-"full" branch here. */
export function formatDatePoint(point: DatePoint, lang: CvContentLanguage): string {
  if (point.granularity === "full") return `${monthName(point.month, lang)} ${point.year}`;
  return String(point.year);
}

export function formatDateEnd(end: DateEnd, lang: CvContentLanguage): string {
  if (end.isPresent) return PRESENT_LABEL[lang];
  if (end.granularity === "full") return `${monthName(end.month, lang)} ${end.year}`;
  return String(end.year);
}

export function formatDateRange(range: DateRange, lang: CvContentLanguage): string {
  return `${formatDatePoint(range.start, lang)} – ${formatDateEnd(range.end, lang)}`;
}
