// Placeholder barrel — the real template-rendering engine (layout engine +
// the 4 template components: Helsinki, Lisbon, Kyoto, Denver) lands here.
// See /Users/rneves/.claude/plans/calm-enchanting-wilkes.md, "packages/cv-render".
//
// This package is imported by BOTH apps/web (client-side live preview) and
// apps/api (server-side, via react-dom/server + Puppeteer for PDF export) —
// that shared import is what guarantees preview/export pixel-equivalence.
// Do not fork the rendering logic between the two call sites.

export { CvDocument } from "./cv-document.js";
export type { CvRenderData } from "./types.js";
