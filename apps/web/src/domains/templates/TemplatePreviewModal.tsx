import type { CvRenderData, TemplateDefinition } from "@cv-maker/contracts";
import { CvDocument } from "@cv-maker/cv-render";
import { Button, Modal, clsx } from "@/components/ui";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";

interface TemplatePreviewModalProps {
  open: boolean;
  onClose: () => void;
  definition: TemplateDefinition;
  baseRenderData: CvRenderData | undefined;
  color: string;
  onColorChange: (color: string) => void;
  onConfirmSelect: () => void;
  selected: boolean;
}

/** `position: fixed` + viewport-centered by construction, via the shared
 * <Modal/> — the direct fix for the reference product's confirmed
 * off-screen-preview defect (features/17). Live-rendered via
 * @cv-maker/cv-render's <CvDocument/>, fed the CV's real render data with
 * just `templateId`/`accentColor` swapped for whichever card is open, so
 * color changes are instant with no reload. */
export function TemplatePreviewModal({
  open,
  onClose,
  definition,
  baseRenderData,
  color,
  onColorChange,
  onConfirmSelect,
  selected,
}: TemplatePreviewModalProps) {
  const locale = useBuilderLocale();
  const previewData: CvRenderData | null = baseRenderData
    ? { ...baseRenderData, templateId: definition.id, accentColor: color }
    : null;

  return (
    <Modal open={open} onClose={onClose} title={definition.name}>
      <div className="flex flex-col gap-4">
        <p className="text-xs text-text-muted">{t(locale, "templates.previewCaption")}</p>

        <div className="flex items-center gap-2">
          {definition.colorPalette.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={swatch}
              aria-pressed={swatch === color}
              onClick={() => onColorChange(swatch)}
              className={clsx(
                "h-7 w-7 shrink-0 rounded-full border-2 transition-transform duration-fast",
                swatch === color ? "scale-110 border-heading" : "border-transparent hover:scale-105",
              )}
              style={{ background: swatch }}
            />
          ))}
        </div>

        <div className="max-h-[55vh] overflow-y-auto rounded-md border border-[var(--border-on-light)] bg-white p-2">
          {previewData ? (
            <CvDocument data={previewData} />
          ) : (
            <p className="p-10 text-center text-sm text-text-muted">{t(locale, "templates.loadingPreview")}</p>
          )}
        </div>

        <Button onClick={onConfirmSelect} disabled={selected} className="self-start">
          {selected ? t(locale, "templates.selected") : `${t(locale, "templates.select")} ${definition.name}`}
        </Button>
      </div>
    </Modal>
  );
}
