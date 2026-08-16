import { useQuery } from "@tanstack/react-query";
import type { SectionType } from "@cv-maker/contracts";
import { entriesApi, type EntryKind } from "./entries-api.js";
import { entriesQueryKey } from "./useEntries.js";

export const SECTION_TYPE_TO_ENTRY_KIND: Partial<Record<SectionType, EntryKind>> = {
  work_experience: "work-experience",
  education: "education",
  courses: "courses",
  skills: "skills",
  languages: "languages",
  hobbies: "hobbies",
  references: "references",
};

/** Reads (and, if not already cached by the section's own entry-list hook,
 * fetches) the entry count for a structured section's completion badge.
 * Shares its TanStack Query cache entry with that section component's own
 * `useEntries` call — same query key, so this never double-fetches. */
export function useEntryCount(sectionType: SectionType, sectionId: string): number | undefined {
  const kind = SECTION_TYPE_TO_ENTRY_KIND[sectionType];
  const query = useQuery({
    queryKey: entriesQueryKey(kind ?? "skills", sectionId),
    queryFn: () => entriesApi(kind as EntryKind).list(sectionId),
    enabled: !!kind,
  });
  return kind ? (query.data?.length ?? 0) : undefined;
}
