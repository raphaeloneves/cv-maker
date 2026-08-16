import type { CvRenderData } from "./types.js";

/**
 * PLACEHOLDER — replaced by the real layout engine + 4 template components
 * (Helsinki, Lisbon, Kyoto, Denver) per features/17-template-theme-selection.md.
 *
 * This is the single render entry point used by BOTH the browser-side live
 * preview and the server-side PDF export (react-dom/server + Puppeteer) —
 * keep it that way; do not let the two call sites diverge.
 */
export function CvDocument({ data }: { data: CvRenderData }) {
  return (
    <div data-template={data.templateId} style={{ ["--accent" as string]: data.accentColor }}>
      <p>cv-render placeholder — template &quot;{data.templateId}&quot; not yet implemented.</p>
      {data.watermarked && <div data-watermark="true">CV Maker</div>}
    </div>
  );
}
