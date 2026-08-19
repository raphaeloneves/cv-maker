import type { BuilderLocale } from "@cv-maker/contracts";

/** Shared date formatting for this domain — same `Intl.DateTimeFormat`
 * pattern as `CvDashboard.tsx`'s `formatUpdated` (pt-PT vs en-GB,
 * `dateStyle: "medium"`), kept local here since several surfaces in this
 * domain need it (report cards, the CV picker, the report detail view). */
export function formatDate(iso: string, locale: BuilderLocale): string {
  try {
    return new Intl.DateTimeFormat(locale === "pt-PT" ? "pt-PT" : "en-GB", {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
