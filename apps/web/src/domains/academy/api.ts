import { apiGet, apiPost } from "@/lib/api-client";
import type { AcademyLessonContent, AcademyOutline } from "@cv-maker/contracts";

/** Academy — see docs/api-routes.md "Academy". Everything (outline + lesson
 * bodies) is fetched from the API rather than statically bundled: `apps/web`
 * builds `output: "static"` (astro.config.mjs), so anything baked into the
 * static bundle is visible in devtools regardless of a client-side gate.
 * Pro-only lesson text must only ever reach the browser after the API's own
 * entitlement check, same as CV Optimizer report content. */
export function getOutline(): Promise<AcademyOutline> {
  return apiGet<AcademyOutline>("/academy/outline");
}

export function getLesson(slug: string): Promise<AcademyLessonContent> {
  return apiGet<AcademyLessonContent>(`/academy/lessons/${encodeURIComponent(slug)}`);
}

export function markLessonComplete(slug: string): Promise<void> {
  return apiPost<void>(`/academy/lessons/${encodeURIComponent(slug)}/complete`);
}
