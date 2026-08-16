// The shared, framework-agnostic template-rendering engine (layout engine +
// the 4 template components: Helsinki, Lisbon, Kyoto, Denver).
//
// This package is imported by BOTH apps/web (client-side live preview) and
// apps/api (server-side, via react-dom/server + Puppeteer for PDF export) —
// that shared import is what guarantees preview/export pixel-equivalence.
// Do not fork the rendering logic between the two call sites.
//
// Plain CSS lives in ./styles.css (see package.json's "./styles.css" export)
// — apps/web imports it via its bundler, apps/api reads it as raw text to
// inline into the Puppeteer HTML wrapper. No CSS Modules/CSS-in-JS here.

export { CvDocument } from "./cv-document.js";
export type { CvRenderData, RenderSection } from "./types.js";

// A handful of pure layout helpers, exported for reuse by callers that need
// the same section-preparation/formatting logic outside of <CvDocument> (e.g.
// a template-gallery thumbnail, or the export pipeline computing page counts).
export { prepareSections } from "./layout/prepare.js";
export { sortSectionChronologically, compareDateRangesDescending } from "./layout/chronology.js";
export { sectionHasContent, richTextHasContent } from "./layout/content.js";
export { sectionBreakClassName, sectionClassNames, entryClassNames } from "./layout/page-break.js";
export { formatDateRange, formatDatePoint, formatDateEnd } from "./layout/dates.js";
export { skillLevelPercent } from "./layout/meter.js";
export { deriveHeadline } from "./layout/headline.js";
