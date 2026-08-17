import { useEffect, useRef, useState } from "react";
import type { TemplateId } from "@cv-maker/contracts";
import { CvDocument } from "@cv-maker/cv-render";
import { DEMO_CV_RENDER_DATA } from "./demo-cv-data.js";

/** A4 page width in CSS px at the 96dpi the browser uses to resolve `mm`
 * units (1in = 25.4mm = 96px) — matches `.cv-document`'s `width: 210mm` in
 * packages/cv-render/src/styles.css exactly, so the scale factor computed
 * below always lines the miniature render up with its real full-size page. */
const A4_WIDTH_PX = (210 / 25.4) * 96;
const A4_HEIGHT_PX = (297 / 25.4) * 96;

interface TemplateThumbnailProps {
  templateId: TemplateId;
  color: string;
  className?: string;
}

/** A genuine miniature render of the template — the same `<CvDocument>` used
 * by the live preview modal and by PDF export, fed the shared demo dataset
 * (see demo-cv-data.ts) and scaled down via CSS `transform: scale()` inside
 * a fixed-aspect, `overflow: hidden` frame. This is what makes every card in
 * the gallery an accurate, distinct preview of the real design, instead of
 * an abstract layout-shape approximation that made every template look the
 * same. Scale is measured (not hardcoded) so it stays exact across the
 * gallery's responsive column counts. */
export function TemplateThumbnail({ templateId, color, className }: TemplateThumbnailProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / A4_WIDTH_PX);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const data = { ...DEMO_CV_RENDER_DATA, templateId, accentColor: color };

  return (
    <div
      ref={frameRef}
      className={["relative w-full overflow-hidden bg-white", className].filter(Boolean).join(" ")}
      style={{ aspectRatio: "210 / 297" }}
      aria-hidden="true"
    >
      {scale !== null && (
        <div
          style={{
            width: A4_WIDTH_PX,
            height: A4_HEIGHT_PX,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            pointerEvents: "none",
          }}
        >
          <CvDocument data={data} />
        </div>
      )}
    </div>
  );
}
