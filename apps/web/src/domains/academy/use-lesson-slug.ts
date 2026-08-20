import { useEffect, useState } from "react";

/** `apps/web` is a static multi-page app (no client-side router), so the
 * lesson being viewed on `/academy` travels as a `?lesson=` query param
 * rather than component state — same convention as
 * `domains/optimizer/use-report-id.ts`'s `?reportId=`. Keeps refresh and
 * deep-linking to a specific lesson working. */
export function getLessonSlug(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("lesson");
}

/** Client-only read of the current `?lesson=`. `undefined` until the first
 * client render tick resolves it (Astro islands render once on the server,
 * then hydrate) — treat that as "not yet known" rather than "definitely
 * absent". Resolves to `null` once it's genuinely absent, at which point
 * the caller picks a default and calls `setLessonSlug`. */
export function useLessonSlug(): string | null | undefined {
  const [slug, setSlug] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    setSlug(getLessonSlug());
    // `setLessonSlug` below dispatches a synthetic `popstate` after
    // `pushState` (browsers don't fire it themselves for script-driven
    // history changes) so every mounted reader picks up the new slug.
    const onPopState = () => setSlug(getLessonSlug());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  return slug;
}

/** Updates `?lesson=` without a full page navigation (`history.pushState`),
 * so clicking between lessons in the sidebar doesn't reload the app shell. */
export function setLessonSlug(slug: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set("lesson", slug);
  window.history.pushState({}, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
