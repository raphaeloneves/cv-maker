import { useState } from "react";
import { Button, clsx } from "@/components/ui";
import { t } from "@/i18n";
import { getStoredLocale } from "@/lib/locale";
import { deletePhoto } from "@/domains/personal-info/api";
import { PhotoUploadModal } from "@/domains/personal-info/components/PhotoUploadModal";

interface PhotoFieldProps {
  cvId: string;
  photoUrl: string | null | undefined;
  onSaved: (photoUrl: string, crop: { zoom: number; rotationDeg: number }) => void;
  onRemoved: () => void;
}

/** The "Add photo" placeholder tile + saved thumbnail on Personal Info.
 * Clicking either opens the crop/zoom/rotate modal (features/02); a
 * separate, explicit "Remove photo" link clears it without reopening the
 * modal (an inferred-but-reasonable requirement per that feature's notes). */
export function PhotoField({ cvId, photoUrl, onSaved, onRemoved }: PhotoFieldProps) {
  const locale = getStoredLocale();
  const [modalOpen, setModalOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    setRemoving(true);
    try {
      await deletePhoto(cvId);
      onRemoved();
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        aria-label={photoUrl ? t(locale, "photo.changePhoto") : t(locale, "photo.addPhoto")}
        className={clsx(
          "flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-colors duration-fast ease-standard",
          photoUrl ? "border-transparent" : "border-[var(--border-on-light)] bg-surface-sunken/50 hover:border-orange",
        )}
      >
        {photoUrl ? (
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-text-muted">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <rect x="3" y="7" width="18" height="13" rx="2" />
              <circle cx="12" cy="13.5" r="3.2" />
              <path d="M8 7l1.2-2h5.6L16 7" />
            </svg>
            <span className="mono-label text-[9px]">{t(locale, "photo.addPhoto")}</span>
          </span>
        )}
      </button>

      {photoUrl && (
        <Button variant="ghost" size="sm" loading={removing} onClick={handleRemove} className="text-xs">
          {t(locale, "photo.removePhoto")}
        </Button>
      )}

      <PhotoUploadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        cvId={cvId}
        onSaved={(url, crop) => {
          onSaved(url, crop);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
