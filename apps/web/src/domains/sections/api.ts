import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type { CreateSection, Section, UpdateSection } from "@cv-maker/contracts";

/** Generic section CRUD — see docs/api-routes.md "Sections — generic". */
export const sectionsApi = {
  list: (cvId: string) => apiGet<Section[]>(`/cvs/${cvId}/sections`),
  create: (cvId: string, body: CreateSection) => apiPost<Section>(`/cvs/${cvId}/sections`, body),
  update: (cvId: string, sectionId: string, body: UpdateSection) =>
    apiPatch<Section>(`/cvs/${cvId}/sections/${sectionId}`, body),
  remove: (cvId: string, sectionId: string) => apiDelete<void>(`/cvs/${cvId}/sections/${sectionId}`),
  reorder: (cvId: string, orderedSectionIds: string[]) =>
    apiPost<Section[]>(`/cvs/${cvId}/sections/reorder`, { orderedSectionIds }),
  saveFreeform: (sectionId: string, description: string | null) =>
    apiPatch<Section>(`/sections/${sectionId}/freeform`, { description }),
};
