/** features/16-builder-navigation-progress.md. Single source of truth for the
 * 4-step builder flow — route path, stepper label, and page heading are
 * always derived from the SAME entry here, fixing the reference product's
 * `#/historico/` route vs "Experiências" heading mismatch. Payment is an
 * honest 4th stepper node (the reference hides it entirely). */
export const BUILDER_STEPS = [
  { key: "personal-info", path: "/builder/personal-info" },
  { key: "content", path: "/builder/content" },
  { key: "template", path: "/builder/template" },
  { key: "checkout", path: "/builder/checkout" },
] as const;

export type BuilderStepKey = (typeof BUILDER_STEPS)[number]["key"];
