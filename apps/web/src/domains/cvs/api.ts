import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import type { Cv, CreateCvInput, UpdateCvInput } from "@cv-maker/contracts";

export function listCvs(): Promise<Cv[]> {
  return apiGet<Cv[]>("/cvs");
}

export function getCv(cvId: string): Promise<Cv> {
  return apiGet<Cv>(`/cvs/${cvId}`);
}

export function createCv(input?: Partial<CreateCvInput>): Promise<Cv> {
  return apiPost<Cv>("/cvs", input ?? {});
}

/** Used by the Personal Info step's "CV language" selector — `contentLanguage`
 * lives on the CV shell, not on `personal-info` (features/03: it's the
 * generated CV's structural-text language, orthogonal to `builderUiLocale`). */
export function updateCv(cvId: string, input: UpdateCvInput): Promise<Cv> {
  return apiPatch<Cv>(`/cvs/${cvId}`, input);
}

export function deleteCv(cvId: string): Promise<void> {
  return apiDelete<void>(`/cvs/${cvId}`);
}
