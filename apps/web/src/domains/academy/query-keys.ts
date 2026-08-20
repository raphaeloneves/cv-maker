/** Shared between AcademyPage (which fetches the outline and needs to
 * invalidate it after a completion) and LessonPanel (which triggers that
 * invalidation on "Mark as complete"). */
export const ACADEMY_OUTLINE_QUERY_KEY = ["academy-outline"];
