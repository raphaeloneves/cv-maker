import { z } from "zod";

/** features/02-profile-photo-upload.md. Only the final cropped output is ever
 * persisted server-side — no raw-image versioning, no per-slider-move calls.
 * `jpg`/`png` only, enforced client-side AND re-checked server-side (never
 * trust a client-only MIME check). */
export const ACCEPTED_PHOTO_MIME_TYPES = ["image/jpeg", "image/png"] as const;
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export const uploadPhotoResponseSchema = z.object({
  photoUrl: z.string().url(),
});
export type UploadPhotoResponse = z.infer<typeof uploadPhotoResponseSchema>;
