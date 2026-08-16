// Explicit React import — required even under the "react-jsx" automatic
// transform: workspace-symlinked packages consumed by tsx/esbuild across
// package boundaries do not reliably pick up this package's own tsconfig
// jsx setting, and can fall back to the classic transform (`React.createElement`),
// which throws `ReferenceError: React is not defined` without this import.
import React from "react";
import type { ContactItemKind } from "./personal.js";

/** Minimal inline-SVG icon set for contact items — no external icon font/CDN
 * (would violate the "no external requests" / self-contained-stylesheet
 * requirement), just plain paths, styled via `currentColor` so each
 * template's CSS controls their color. */
const ICON_PATHS: Record<ContactItemKind, string> = {
  email: "M2 4.5h12v7H2v-7Zm0 0 6 4.5 6-4.5",
  phone:
    "M4.5 2.5 6 4l-1 2c.6 1.4 1.6 2.4 3 3l2-1 1.5 1.5v2c0 .55-.45 1-1 1C6.5 12.5 3.5 9.5 3.5 4.5c0-.55.45-1 1-1Z",
  location: "M8 14s4.5-4.2 4.5-7.5S10.8 1.5 8 1.5 3.5 3.2 3.5 6.5 8 14 8 14Zm0-6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  linkedin:
    "M2.5 5.5h2.4v8H2.5v-8Zm1.2-3.6a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8ZM7 5.5h2.3v1.1c.3-.6 1.1-1.3 2.3-1.3 2.5 0 2.9 1.6 2.9 3.7v4.5h-2.4V9.4c0-.9 0-2-1.2-2s-1.4 1-1.4 2v4.1H7v-8Z",
  website: "M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm-6.5-6.5h13M8 1.5c1.7 1.8 2.6 4 2.6 6.5S9.7 12.7 8 14.5c-1.7-1.8-2.6-4-2.6-6.5S6.3 3.3 8 1.5Z",
};

export function ContactIcon({ kind }: { kind: ContactItemKind }) {
  return (
    <svg
      className="cv-icon"
      viewBox="0 0 16 16"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICON_PATHS[kind]} />
    </svg>
  );
}
