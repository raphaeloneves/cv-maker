import { useCallback, useEffect, useRef, useState } from "react";
import { ACCEPTED_PHOTO_MIME_TYPES, MAX_PHOTO_BYTES } from "@cv-maker/contracts";
import { Button, Modal, clsx } from "@/components/ui";
import { t } from "@/i18n";
import { getStoredLocale } from "@/lib/locale";
import { ApiError } from "@/lib/api-client";
import { uploadPhoto } from "@/domains/personal-info/api";

const FRAME = 288;
const EXPORT_SIZE = 640;
const ZOOM_MIN = 1;
const ZOOM_MAX = 4;

interface PhotoUploadModalProps {
  open: boolean;
  onClose: () => void;
  cvId: string;
  onSaved: (photoUrl: string, crop: { zoom: number; rotationDeg: number }) => void;
}

type Mode = "dropzone" | "editor";

/**
 * Photo upload + crop/zoom/rotate editor (features/02-profile-photo-upload.md).
 * One reusable `<Modal>` that swaps its inner content between the drop-zone
 * and the loaded editor rather than two separate dialogs, so "Reset" and
 * re-selecting a file both feel instantaneous. All zoom/rotate/pan
 * manipulation happens live on a `<canvas>` in the browser — nothing is sent
 * to the server until "Save" is clicked, which uploads exactly one final
 * cropped JPEG blob.
 */
export function PhotoUploadModal({ open, onClose, cvId, onSaved }: PhotoUploadModalProps) {
  const locale = getStoredLocale();
  const [mode, setMode] = useState<Mode>("dropzone");
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const dragState = useRef<{ dragging: boolean; startX: number; startY: number; panX: number; panY: number }>({
    dragging: false,
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0,
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetEditorState = useCallback(() => {
    setZoom(1);
    setRotationDeg(0);
    setPan({ x: 0, y: 0 });
  }, []);

  // Reset to the empty drop-zone whenever the modal is closed/reopened fresh.
  useEffect(() => {
    if (!open) {
      setMode("dropzone");
      setImage(null);
      setDropError(null);
      setSaveError(null);
      resetEditorState();
    }
  }, [open, resetEditorState]);

  function loadFile(file: File) {
    setDropError(null);
    if (!(ACCEPTED_PHOTO_MIME_TYPES as readonly string[]).includes(file.type)) {
      setDropError(t(locale, "photo.dropzone.error.type"));
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setDropError(t(locale, "photo.dropzone.error.size"));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resetEditorState();
      setImage(img);
      setMode("editor");
    };
    img.onerror = () => setDropError(t(locale, "photo.dropzone.error.type"));
    img.src = url;
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }

  // --- Canvas drawing -------------------------------------------------

  function draw(ctx: CanvasRenderingContext2D, size: number, img: HTMLImageElement) {
    const swapped = rotationDeg % 180 !== 0;
    const w = swapped ? img.height : img.width;
    const h = swapped ? img.width : img.height;
    const baseScale = Math.max(size / w, size / h);
    const scale = baseScale * zoom;
    const panScale = size / FRAME;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size / 2 + pan.x * panScale, size / 2 + pan.y * panScale);
    ctx.rotate((rotationDeg * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  }

  useEffect(() => {
    if (mode !== "editor" || !image) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = FRAME;
    canvas.height = FRAME;
    draw(ctx, FRAME, image);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, image, zoom, rotationDeg, pan]);

  // --- Drag to reposition ----------------------------------------------

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    dragState.current = { dragging: true, startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  }
  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const clamp = FRAME;
    setPan({
      x: Math.max(-clamp, Math.min(clamp, dragState.current.panX + dx)),
      y: Math.max(-clamp, Math.min(clamp, dragState.current.panY + dy)),
    });
  }
  function onPointerUp() {
    dragState.current.dragging = false;
  }

  async function handleSave() {
    if (!image || !canvasRef.current) return;
    setSaving(true);
    setSaveError(null);
    try {
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = EXPORT_SIZE;
      exportCanvas.height = EXPORT_SIZE;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) throw new Error("canvas unsupported");
      draw(ctx, EXPORT_SIZE, image);

      const blob: Blob = await new Promise((resolve, reject) => {
        exportCanvas.toBlob(
          (result) => (result ? resolve(result) : reject(new Error("toBlob failed"))),
          "image/jpeg",
          0.92,
        );
      });

      const { photoUrl } = await uploadPhoto(cvId, blob);
      onSaved(photoUrl, { zoom, rotationDeg });
      onClose();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : t(locale, "common.error.generic"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t(locale, "photo.modal.title")}>
      {mode === "dropzone" && (
        <div>
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={clsx(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-14 text-center transition-colors duration-fast ease-standard",
              isDragOver ? "border-orange bg-orange/5" : "border-[var(--border-on-light)] bg-surface-sunken/40",
            )}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="1.5" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
            </svg>
            <p className="text-sm font-medium text-heading">{t(locale, "photo.dropzone.text")}</p>
            <p className="text-xs text-text-muted">{t(locale, "photo.dropzone.formats")}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_PHOTO_MIME_TYPES.join(",")}
              onChange={handleInputChange}
              className="sr-only"
            />
          </div>
          {dropError && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {dropError}
            </p>
          )}
        </div>
      )}

      {mode === "editor" && image && (
        <div className="flex flex-col items-center gap-5">
          <div className="overflow-hidden rounded-full border border-[var(--border-on-light)] shadow-sm" style={{ width: FRAME, height: FRAME }}>
            <canvas
              ref={canvasRef}
              width={FRAME}
              height={FRAME}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              className="cursor-move touch-none"
              aria-label={t(locale, "photo.editor.dragHint")}
            />
          </div>
          <p className="text-xs text-text-muted">{t(locale, "photo.editor.dragHint")}</p>

          <div className="w-full max-w-xs">
            <label htmlFor="photo-zoom" className="mb-1 block text-xs font-medium text-heading">
              {t(locale, "photo.editor.zoom")}
            </label>
            <input
              id="photo-zoom"
              type="range"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-orange"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setRotationDeg((r) => (r + 90) % 360)}>
              {t(locale, "photo.editor.rotate")}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={resetEditorState}>
              {t(locale, "photo.editor.reset")}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setMode("dropzone")}>
              {t(locale, "photo.editor.cancel")}
            </Button>
          </div>

          {saveError && (
            <p role="alert" className="text-sm text-danger">
              {saveError}
            </p>
          )}

          <Button type="button" size="lg" loading={saving} disabled={!image} onClick={handleSave} className="w-full max-w-xs">
            {saving ? t(locale, "photo.editor.saving") : t(locale, "photo.editor.save")}
          </Button>
        </div>
      )}
    </Modal>
  );
}
