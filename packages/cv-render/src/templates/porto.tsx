// Explicit React import — required even under the "react-jsx" automatic
// transform: workspace-symlinked packages consumed by tsx/esbuild across
// package boundaries do not reliably pick up this package's own tsconfig
// jsx setting, and can fall back to the classic transform (`React.createElement`),
// which throws `ReferenceError: React is not defined` without this import.
import React from "react";
import type { CvRenderData } from "@cv-maker/contracts";
import { templateLayoutFor } from "../layout/definition.js";
import { prepareSections } from "../layout/prepare.js";
import { buildContactItems, fullName } from "../layout/personal.js";
import { ContactList, Section, Watermark } from "./shared.js";

const LAYOUT = templateLayoutFor("porto");

/** Porto: quiet, single-column, text-first — no photo, no sidebar, nothing
 * graphical competing with the words. A large name, one line of pipe-
 * separated contact facts, a single accent rule, then every section in full
 * narrative detail. Built to read cleanly both on screen and through an ATS
 * parser. Premium, and the gallery's curated "Recommended" pick — this is
 * the shape a long, senior career history reads best in. */
export function PortoTemplate({ data }: { data: CvRenderData }) {
  const name = fullName(data.personalInfo);
  const contactItems = buildContactItems(data.personalInfo);
  const sections = prepareSections(data.sections);

  return (
    <div className="cv-document cv-document--porto" style={{ ["--accent" as string]: data.accentColor }}>
      {data.watermarked ? <Watermark /> : null}
      <div className="cv-porto__page">
        <header className="cv-porto__header">
          {name ? <h1 className="cv-porto__name">{name}</h1> : null}
          <ContactList items={contactItems} className="cv-porto__contact" />
        </header>
        <main className="cv-porto__main">
          {sections.map((section) => (
            <Section
              key={section.id}
              section={section}
              contentLanguage={data.contentLanguage}
              meterStyle={LAYOUT.meterStyle}
              className="cv-porto__section"
            />
          ))}
        </main>
      </div>
    </div>
  );
}
