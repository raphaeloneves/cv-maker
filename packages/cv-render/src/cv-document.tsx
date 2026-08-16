// Explicit React import — required even under the "react-jsx" automatic
// transform: workspace-symlinked packages consumed by tsx/esbuild across
// package boundaries do not reliably pick up this package's own tsconfig
// jsx setting, and can fall back to the classic transform (`React.createElement`),
// which throws `ReferenceError: React is not defined` without this import.
import React from "react";
import type { CvRenderData } from "./types.js";
import { DenverTemplate } from "./templates/denver.js";
import { HelsinkiTemplate } from "./templates/helsinki.js";
import { KyotoTemplate } from "./templates/kyoto.js";
import { LisbonTemplate } from "./templates/lisbon.js";

/**
 * The single render entry point used by BOTH the browser-side live preview
 * (apps/web) and the server-side PDF export (apps/api, via react-dom/server +
 * Puppeteer) — keep it that way; do not let the two call sites diverge. Pure,
 * server-renderable React: no `window`/`document`/browser-only APIs anywhere
 * in the component tree this dispatches into.
 */
export function CvDocument({ data }: { data: CvRenderData }) {
  switch (data.templateId) {
    case "helsinki":
      return <HelsinkiTemplate data={data} />;
    case "lisbon":
      return <LisbonTemplate data={data} />;
    case "kyoto":
      return <KyotoTemplate data={data} />;
    case "denver":
      return <DenverTemplate data={data} />;
  }
}
