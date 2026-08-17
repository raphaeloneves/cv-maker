// Explicit React import — required even under the "react-jsx" automatic
// transform: workspace-symlinked packages consumed by tsx/esbuild across
// package boundaries do not reliably pick up this package's own tsconfig
// jsx setting, and can fall back to the classic transform (`React.createElement`),
// which throws `ReferenceError: React is not defined` without this import.
import React from "react";
import type { CvRenderData, SectionType } from "@cv-maker/contracts";
import { templateLayoutFor } from "../layout/definition.js";
import { deriveHeadline } from "../layout/headline.js";
import { prepareSections } from "../layout/prepare.js";
import { buildContactItems, buildPersonalDetails, fullName } from "../layout/personal.js";
import { ContactList, PersonalDetailsList, Section, Watermark, partitionSections } from "./shared.js";

const LAYOUT = templateLayoutFor("geneva");

const SIDEBAR_TYPES: readonly SectionType[] = ["skills", "languages", "hobbies", "references"];

/** Geneva: quiet, precise, Swiss-grid minimalism — no photo, generous white
 * space, a slender rule-divided left column carrying facts as dot meters in
 * small-caps mono labels, beside a calm main column set in restrained type.
 * Premium. */
export function GenevaTemplate({ data }: { data: CvRenderData }) {
  const name = fullName(data.personalInfo);
  const headline = deriveHeadline(data.sections);
  const contactItems = buildContactItems(data.personalInfo);
  const personalDetails = buildPersonalDetails(data.personalInfo, data.contentLanguage);
  const sections = prepareSections(data.sections);
  const { sidebar, main } = partitionSections(sections, SIDEBAR_TYPES);

  return (
    <div className="cv-document cv-document--geneva" style={{ ["--accent" as string]: data.accentColor }}>
      {data.watermarked ? <Watermark /> : null}
      <div className="cv-geneva__page">
        <aside className="cv-geneva__sidebar">
          <ContactList items={contactItems} className="cv-geneva__contact" />
          <PersonalDetailsList items={personalDetails} className="cv-geneva__personal-details" />
          {sidebar.map((section) => (
            <Section
              key={section.id}
              section={section}
              contentLanguage={data.contentLanguage}
              meterStyle={LAYOUT.meterStyle}
              className="cv-geneva__section"
            />
          ))}
        </aside>
        <main className="cv-geneva__main">
          <header className="cv-geneva__header">
            {name ? <h1 className="cv-geneva__name">{name}</h1> : null}
            {headline ? <p className="cv-geneva__headline">{headline}</p> : null}
          </header>
          {main.map((section) => (
            <Section
              key={section.id}
              section={section}
              contentLanguage={data.contentLanguage}
              meterStyle={LAYOUT.meterStyle}
              className="cv-geneva__section"
            />
          ))}
        </main>
      </div>
    </div>
  );
}
