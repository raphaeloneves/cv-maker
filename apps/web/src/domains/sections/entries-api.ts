import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";

/** `{kind}` path segments shared by every repeatable structured section —
 * see docs/api-routes.md "Section entries". */
export type EntryKind =
  | "work-experience"
  | "education"
  | "courses"
  | "skills"
  | "languages"
  | "hobbies"
  | "references";

export interface EntriesApi<TEntry, TUpsert> {
  list: (sectionId: string) => Promise<TEntry[]>;
  create: (sectionId: string, body: TUpsert) => Promise<TEntry>;
  update: (sectionId: string, entryId: string, body: Partial<TUpsert>) => Promise<TEntry>;
  remove: (sectionId: string, entryId: string) => Promise<void>;
  reorder: (sectionId: string, orderedEntryIds: string[]) => Promise<TEntry[]>;
}

/** One generic factory instead of hand-writing the same 5-route CRUD client
 * seven times (once per structured entry kind). */
export function entriesApi<TEntry, TUpsert>(kind: EntryKind): EntriesApi<TEntry, TUpsert> {
  return {
    list: (sectionId) => apiGet<TEntry[]>(`/sections/${sectionId}/${kind}`),
    create: (sectionId, body) => apiPost<TEntry>(`/sections/${sectionId}/${kind}`, body),
    update: (sectionId, entryId, body) => apiPatch<TEntry>(`/sections/${sectionId}/${kind}/${entryId}`, body),
    remove: (sectionId, entryId) => apiDelete<void>(`/sections/${sectionId}/${kind}/${entryId}`),
    reorder: (sectionId, orderedEntryIds) =>
      apiPost<TEntry[]>(`/sections/${sectionId}/${kind}/reorder`, { orderedEntryIds }),
  };
}
