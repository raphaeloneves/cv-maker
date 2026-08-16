import { apiGet, apiPatch, apiPut } from "@/lib/api-client";
import type { Cv, CvTemplatePreference, TemplateId } from "@cv-maker/contracts";

/** See docs/api-routes.md "Templates". `TEMPLATE_DEFINITIONS` itself is a
 * static constant imported directly from @cv-maker/contracts — only the
 * per-CV color preference and the CV's currently-selected template are
 * server state. */
export const templatesApi = {
  listPreferences: (cvId: string) => apiGet<CvTemplatePreference[]>(`/cvs/${cvId}/template-preferences`),
  setPreference: (cvId: string, templateId: TemplateId, color: string) =>
    apiPut<CvTemplatePreference>(`/cvs/${cvId}/template-preferences/${templateId}`, { color }),
  selectTemplate: (cvId: string, templateId: TemplateId) => apiPatch<Cv>(`/cvs/${cvId}`, { templateId }),
};
