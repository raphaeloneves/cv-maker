import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { entriesApi, type EntryKind } from "./entries-api.js";

export function entriesQueryKey(kind: EntryKind, sectionId: string) {
  return ["entries", kind, sectionId] as const;
}

/** Entry list + mutations for one repeatable-entry section, parameterized by
 * `{kind}` — the same hook drives work experience, education, courses,
 * skills, languages, hobbies, and references. */
export function useEntries<TEntry extends { id: string }, TUpsert>(kind: EntryKind, sectionId: string) {
  const api = entriesApi<TEntry, TUpsert>(kind);
  const qc = useQueryClient();
  const key = entriesQueryKey(kind, sectionId);

  const query = useQuery({
    queryKey: key,
    queryFn: () => api.list(sectionId),
    enabled: !!sectionId,
  });

  const create = useMutation({
    mutationFn: (body: TUpsert) => api.create(sectionId, body),
    onSuccess: (entry) => {
      qc.setQueryData<TEntry[]>(key, (old = []) => [...old, entry]);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<TUpsert> }) => api.update(sectionId, id, body),
    onSuccess: (entry) => {
      qc.setQueryData<TEntry[]>(key, (old = []) => old.map((e) => (e.id === entry.id ? entry : e)));
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.remove(sectionId, id),
    onSuccess: (_void, id) => {
      qc.setQueryData<TEntry[]>(key, (old = []) => old.filter((e) => e.id !== id));
    },
  });

  const reorder = useMutation({
    mutationFn: (orderedEntryIds: string[]) => api.reorder(sectionId, orderedEntryIds),
    onMutate: async (orderedEntryIds) => {
      const previous = qc.getQueryData<TEntry[]>(key);
      if (previous) {
        const byId = new Map(previous.map((e) => [e.id, e]));
        qc.setQueryData<TEntry[]>(
          key,
          orderedEntryIds.map((id) => byId.get(id)).filter((e): e is TEntry => !!e),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSuccess: (entries) => qc.setQueryData(key, entries),
  });

  return {
    entries: query.data ?? [],
    isLoading: query.isLoading,
    create: create.mutateAsync,
    update: update.mutateAsync,
    remove: remove.mutateAsync,
    reorder: reorder.mutateAsync,
  };
}
