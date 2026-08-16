import { apiGet, apiPut, apiPostMultipart, apiDelete } from "@/lib/api-client";
import type { PersonalInfo, UpdatePersonalInfo, UploadPhotoResponse } from "@cv-maker/contracts";

export function getPersonalInfo(cvId: string): Promise<PersonalInfo | null> {
  return apiGet<PersonalInfo | null>(`/cvs/${cvId}/personal-info`);
}

/** Upsert — the API creates the row on first save. */
export function savePersonalInfo(cvId: string, input: UpdatePersonalInfo): Promise<PersonalInfo> {
  return apiPut<PersonalInfo>(`/cvs/${cvId}/personal-info`, input);
}

export function uploadPhoto(cvId: string, blob: Blob): Promise<UploadPhotoResponse> {
  const form = new FormData();
  form.append("photo", blob, "photo.jpg");
  return apiPostMultipart<UploadPhotoResponse>(`/cvs/${cvId}/personal-info/photo`, form);
}

export function deletePhoto(cvId: string): Promise<void> {
  return apiDelete<void>(`/cvs/${cvId}/personal-info/photo`);
}
