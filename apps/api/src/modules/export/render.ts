import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import * as React from "react";
import { createElement } from "react";
import { CvDocument } from "@cv-maker/cv-render";
import type { CvRenderData } from "@cv-maker/contracts";

const __dirname = dirname(fileURLToPath(import.meta.url));

// `@cv-maker/cv-render` is consumed directly from its TS source across the
// pnpm workspace symlink (no build step — see its package.json), and its
// JSX gets transpiled under a classic (non-automatic) runtime when reached
// this way, which expects a global `React` in scope. Polyfilling it here
// (apps/api's own module, not a change to that package) keeps export
// working regardless of how that package's own JSX pragma is configured.
(globalThis as unknown as { React: typeof React }).React = React;

/** `@cv-maker/cv-render` is being built by another engineer in parallel —
 * its `styles.css` may not exist yet. Read it defensively via the package's
 * own resolved location (through the pnpm workspace symlink at
 * `node_modules/@cv-maker/cv-render`) so export keeps working (just
 * unstyled) until that file lands, and picks it up automatically afterwards
 * since both apps import the same workspace source. */
function loadCvRenderStyles(): string {
  const candidatePath = resolve(
    __dirname,
    "../../../node_modules/@cv-maker/cv-render/src/styles.css",
  );
  if (!existsSync(candidatePath)) return "";
  try {
    return readFileSync(candidatePath, "utf-8");
  } catch {
    return "";
  }
}

/** Renders the exact same `<CvDocument>` component tree used by the
 * browser-side live preview (via `react-dom/server` here instead of the
 * DOM) into a standalone HTML document ready for Puppeteer's
 * `page.setContent()` — see features/18's "preview and export must be
 * pixel-equivalent" requirement. */
export function renderCvDocumentToHtml(data: CvRenderData): string {
  const bodyMarkup = renderToStaticMarkup(createElement(CvDocument, { data }));
  const styles = loadCvRenderStyles();
  return `<!doctype html>
<html lang="${data.contentLanguage}">
<head>
<meta charset="utf-8" />
<style>${styles}</style>
</head>
<body>${bodyMarkup}</body>
</html>`;
}
