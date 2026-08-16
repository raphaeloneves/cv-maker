import type { DateEnd, DatePoint, DateRange } from "@cv-maker/contracts";

function formatPoint(p: DatePoint, intlLocale: string): string {
  if (p.granularity === "hidden") return "";
  if (p.granularity === "year_only") return String(p.year);
  const fmt = new Intl.DateTimeFormat(intlLocale, { month: "short" });
  return `${fmt.format(new Date(2000, p.month - 1, 1))} ${p.year}`;
}

function formatEnd(e: DateEnd, intlLocale: string, presentLabel: string): string {
  if (e.isPresent) return presentLabel;
  return formatPoint(e, intlLocale);
}

/** Human-readable "Sep 2018 – Present" style summary for a timeline entry's
 * collapsed row. Respects per-endpoint granularity (a "hidden" endpoint
 * contributes nothing to the string, not a blank placeholder). */
export function formatDateRange(
  range: DateRange,
  builderLocale: "pt-PT" | "en",
  presentLabel: string,
): string {
  const intlLocale = builderLocale === "pt-PT" ? "pt-PT" : "en-US";
  const start = formatPoint(range.start, intlLocale);
  const end = formatEnd(range.end, intlLocale, presentLabel);
  if (!start && !end) return "";
  if (!start) return end;
  if (!end) return start;
  return `${start} – ${end}`;
}
