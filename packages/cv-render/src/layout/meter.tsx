// Explicit React import — required even under the "react-jsx" automatic
// transform: workspace-symlinked packages consumed by tsx/esbuild across
// package boundaries do not reliably pick up this package's own tsconfig
// jsx setting, and can fall back to the classic transform (`React.createElement`),
// which throws `ReferenceError: React is not defined` without this import.
import React from "react";
import type { TemplateLayout } from "@cv-maker/contracts";

/** Evenly-spaced 1-5 skill scale → 0-100, matching `languageProficiencyPercent`'s
 * 0-100 continuum so both meter families share one rendering path
 * (features/07's fix for the reference product's uneven 20/25/50/75/100 scale). */
export function skillLevelPercent(level: number): number {
  return Math.min(5, Math.max(1, level)) * 20;
}

export type MeterStyle = TemplateLayout["meterStyle"];

/** The single meter primitive shared by skills and languages, switching
 * presentation per template (`layout.meterStyle`) while both always pass the
 * same normalized 0-100 `percent` plus a human-readable `label` (used as the
 * visible text for the "text" style, and as the accessible label otherwise). */
export function Meter({ percent, style, label }: { percent: number; style: MeterStyle; label: string }) {
  const clamped = Math.min(100, Math.max(0, percent));

  if (style === "bar") {
    return (
      <div className="cv-meter cv-meter--bar" role="img" aria-label={label}>
        <div className="cv-meter__track">
          <div className="cv-meter__fill" style={{ width: `${clamped}%` }} />
        </div>
      </div>
    );
  }

  if (style === "dot") {
    const dotCount = 5;
    const filledDots = Math.round((clamped / 100) * dotCount);
    return (
      <div className="cv-meter cv-meter--dot" role="img" aria-label={label}>
        {Array.from({ length: dotCount }, (_, index) => (
          <span
            key={index}
            className={`cv-meter__dot${index < filledDots ? " cv-meter__dot--filled" : ""}`}
          />
        ))}
      </div>
    );
  }

  return <span className="cv-meter cv-meter--text">{label}</span>;
}
