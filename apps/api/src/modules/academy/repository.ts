import { db } from "../../db.js";

/** Slugs of every lesson the given user has completed. A `Set` since every
 * caller in service.ts only needs O(1) membership checks against it. */
export async function listCompletedSlugs(userId: string): Promise<Set<string>> {
  const rows = await db.academyLessonProgress.findMany({
    where: { userId },
    select: { lessonSlug: true },
  });
  return new Set(rows.map((row) => row.lessonSlug));
}

/** Idempotent — completing an already-completed lesson is a no-op success,
 * not an error (matches the button being disabled once complete, but
 * doesn't rely on the client for that). */
export function markLessonComplete(userId: string, lessonSlug: string) {
  return db.academyLessonProgress.upsert({
    where: { userId_lessonSlug: { userId, lessonSlug } },
    update: {},
    create: { userId, lessonSlug },
  });
}
