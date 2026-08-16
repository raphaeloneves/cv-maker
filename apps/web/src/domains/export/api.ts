import { apiRequestBlob } from "@/lib/api-client";

export interface ExportResult {
  blob: Blob;
  watermarked: boolean;
  pageCount: number | null;
}

/** POST /cvs/:cvId/export — always computed fresh, never cached. Response
 * headers carry watermark/page-count metadata alongside the binary PDF body
 * (see docs/api-routes.md "Render data + export"). */
export async function exportCv(cvId: string): Promise<ExportResult> {
  const res = await apiRequestBlob(`/cvs/${cvId}/export`, { method: "POST" });
  const blob = await res.blob();
  const watermarked = res.headers.get("X-Watermarked") === "true";
  const pageCountHeader = res.headers.get("X-Page-Count");
  return { blob, watermarked, pageCount: pageCountHeader ? Number(pageCountHeader) : null };
}

/** Triggers a browser "Save As" for the exported PDF blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
