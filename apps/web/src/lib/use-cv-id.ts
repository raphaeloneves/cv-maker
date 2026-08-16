import { useEffect, useState } from "react";

/** `apps/web` is a static multi-page app (full browser navigation between
 * Astro pages, see docs/api-routes.md + lib/api-client.ts), so the CV being
 * edited travels as a `?cv=` query param across every builder page rather
 * than client-side router state — see `domains/cvs/components/CvDashboard.tsx`
 * and `domains/personal-info/components/PersonalInfoStep.tsx`, which
 * establish this convention. Every internal builder link (stepper,
 * "back"/"next", template cards) must carry it forward via `withCvId`. */
export function getCvId(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("cv");
}

/** Client-only read of the current `?cv=`. Returns `null` during SSR and on
 * the very first render tick (Astro islands render once on the server
 * before hydrating), then resolves after mount. */
export function useCvId(): string | null {
  const [cvId, setCvId] = useState<string | null>(null);
  useEffect(() => {
    setCvId(getCvId());
  }, []);
  return cvId;
}

/** Appends the current cvId (if any) to a builder path. */
export function withCvId(path: string, cvId: string | null): string {
  if (!cvId) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}cv=${encodeURIComponent(cvId)}`;
}
