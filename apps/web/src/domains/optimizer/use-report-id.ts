import { useEffect, useState } from "react";

/** `apps/web` is a static multi-page app (full browser navigation, no
 * client-side router), so the report being viewed on `/optimizer` travels as
 * a `?reportId=` query param rather than component state — the same
 * convention `lib/use-cv-id.ts` establishes for `?cv=` across the builder.
 * Kept local to this domain (rather than generalizing the shared helper)
 * since the optimizer page is the only consumer. */
export function getReportId(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("reportId");
}

/** Client-only read of the current `?reportId=`. Returns `undefined` until
 * the first client render tick resolves it (Astro islands render once on the
 * server, then hydrate) — treat that as "not yet known" rather than
 * "definitely the list view", so the page doesn't flash the reports list for
 * a frame before switching to a report's detail view. Resolves to `null` once
 * it's genuinely absent. */
export function useReportId(): string | null | undefined {
  const [reportId, setReportId] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    setReportId(getReportId());
  }, []);
  return reportId;
}

/** Builds the detail-view URL for a given report, the `withCvId` counterpart
 * for this domain's single query param. */
export function reportDetailPath(reportId: string): string {
  return `/optimizer?reportId=${encodeURIComponent(reportId)}`;
}
