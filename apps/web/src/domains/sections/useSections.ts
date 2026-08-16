import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateSection, Section, UpdateSection } from "@cv-maker/contracts";
import { sectionsApi } from "./api.js";

export function sectionsQueryKey(cvId: string) {
  return ["sections", cvId] as const;
}

/** Sections list + mutations for one CV, all going through TanStack Query so
 * every mutation (create/rename/hide/reorder/delete) keeps the in-memory
 * list in sync without a manual refetch. */
export function useSections(cvId: string | null) {
  const qc = useQueryClient();
  const key = sectionsQueryKey(cvId ?? "");

  const query = useQuery({
    queryKey: key,
    queryFn: () => sectionsApi.list(cvId as string),
    enabled: !!cvId,
  });

  const create = useMutation({
    mutationFn: (body: CreateSection) => sectionsApi.create(cvId as string, body),
    onSuccess: (section) => {
      qc.setQueryData<Section[]>(key, (old = []) =>
        old.some((s) => s.id === section.id) ? old : [...old, section],
      );
    },
  });

  const update = useMutation({
    mutationFn: ({ sectionId, body }: { sectionId: string; body: UpdateSection }) =>
      sectionsApi.update(cvId as string, sectionId, body),
    onSuccess: (section) => {
      qc.setQueryData<Section[]>(key, (old = []) => old.map((s) => (s.id === section.id ? section : s)));
    },
  });

  const remove = useMutation({
    mutationFn: (sectionId: string) => sectionsApi.remove(cvId as string, sectionId),
    onSuccess: (_void, sectionId) => {
      qc.setQueryData<Section[]>(key, (old = []) => old.filter((s) => s.id !== sectionId));
    },
  });

  const reorder = useMutation({
    mutationFn: (orderedSectionIds: string[]) => sectionsApi.reorder(cvId as string, orderedSectionIds),
    onMutate: async (orderedSectionIds) => {
      const previous = qc.getQueryData<Section[]>(key);
      if (previous) {
        const byId = new Map(previous.map((s) => [s.id, s]));
        qc.setQueryData<Section[]>(
          key,
          orderedSectionIds.map((id) => byId.get(id)).filter((s): s is Section => !!s),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSuccess: (sections) => qc.setQueryData(key, sections),
  });

  return {
    sections: (query.data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder),
    isLoading: query.isLoading,
    createSection: create.mutateAsync,
    creating: create.isPending,
    updateSection: (sectionId: string, body: UpdateSection) => update.mutateAsync({ sectionId, body }),
    removeSection: remove.mutateAsync,
    reorderSections: reorder.mutateAsync,
  };
}
