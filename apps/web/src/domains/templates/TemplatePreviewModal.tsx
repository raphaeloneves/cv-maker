import { useEffect, useRef, useState, type ReactNode } from "react";
import type { TemplateDefinition } from "@cv-maker/contracts";
import { CvDocument } from "@cv-maker/cv-render";
import { Button, Modal, clsx } from "@/components/ui";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";
import { DEMO_CV_RENDER_DATA } from "./demo-cv-data.js";

interface TemplatePreviewModalProps {
  open: boolean;
  onClose: () => void;
  definition: TemplateDefinition;
  color: string;
  onColorChange: (color: string) => void;
  onConfirmSelect: () => void;
  selected: boolean;
}

/** A4 page width in CSS px at 96dpi — see TemplateThumbnail.tsx for the same
 * constant and why it exactly matches `.cv-document`'s `width: 210mm`. */
const A4_WIDTH_PX = (210 / 25.4) * 96;

/** Scales the (fixed, A4-width) `<CvDocument>` down to fit the available
 * width — never up past 100% — using CSS `zoom` rather than `transform`:
 * `zoom` reflows layout at the scaled size, so the container's rendered
 * height tracks the *actual* (possibly multi-page-tall) scaled content with
 * no manual height bookkeeping, and the outer scroll area only ever needs
 * to manage vertical overflow. This is what keeps the preview at a
 * comfortable, legible scale with no horizontal overflow at any modal/
 * viewport width, while still allowing a tall CV to scroll vertically. */
function ScaledPreview({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / A4_WIDTH_PX));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full overflow-x-hidden">
      <div style={{ zoom: scale }}>{children}</div>
    </div>
  );
}

/** `position: fixed` + viewport-centered by construction, via the shared
 * <Modal/> — the direct fix for the reference product's confirmed
 * off-screen-preview defect (features/17). Live-rendered via
 * @cv-maker/cv-render's <CvDocument/>, fed the shared, fully-realized demo
 * dataset (never the signed-in user's own real, possibly-sparse draft) with
 * just `templateId`/`accentColor` swapped for whichever card is open, so
 * color changes are instant with no reload. */
export function TemplatePreviewModal({
  open,
  onClose,
  definition,
  color,
  onColorChange,
  onConfirmSelect,
  selected,
}: TemplatePreviewModalProps) {
  const locale = useBuilderLocale();
  const previewData = { ...DEMO_CV_RENDER_DATA, templateId: definition.id, accentColor: color };

  return (
    <Modal open={open} onClose={onClose} title={definition.name} size="xl">
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

        <div className="max-h-[65vh] overflow-y-auto overflow-x-hidden rounded-md border border-[var(--border-on-light)] bg-white p-2">
          <ScaledPreview>
            <CvDocument data={previewData} />
          </ScaledPreview>
        </div>

        <div className="flex items-center border-t border-[var(--border-on-light)] pt-4">
          <Button onClick={onConfirmSelect} disabled={selected} className="self-start">
            {selected ? t(locale, "templates.selected") : `${t(locale, "templates.select")} ${definition.name}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
