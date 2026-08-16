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

const LAYOUT = templateLayoutFor("kyoto");

const SIDEBAR_TYPES: readonly SectionType[] = ["skills", "languages", "hobbies", "references"];

/** Kyoto: quiet, typographic, no photo — a wide main column carries the
 * candidate's name set large in Syne and their narrative content, a slender
 * right-hand rule-divided sidebar carries facts as plain text-labeled
 * meters ("Advanced", "C1") rather than any graphical fill. Premium. */
export function KyotoTemplate({ data }: { data: CvRenderData }) {
  const name = fullName(data.personalInfo);
  const headline = deriveHeadline(data.sections);
  const contactItems = buildContactItems(data.personalInfo);
  const personalDetails = buildPersonalDetails(data.personalInfo, data.contentLanguage);
  const sections = prepareSections(data.sections);
  const { sidebar, main } = partitionSections(sections, SIDEBAR_TYPES);

  return (
    <div className="cv-document cv-document--kyoto" style={{ ["--accent" as string]: data.accentColor }}>
      {data.watermarked ? <Watermark /> : null}
      <div className="cv-kyoto__page">
        <main className="cv-kyoto__main">
          <header className="cv-kyoto__header">
            {name ? <h1 className="cv-kyoto__name">{name}</h1> : null}
            {headline ? <p className="cv-kyoto__headline">{headline}</p> : null}
          </header>
          {main.map((section) => (
            <Section
              key={section.id}
              section={section}
              contentLanguage={data.contentLanguage}
              meterStyle={LAYOUT.meterStyle}
              className="cv-kyoto__section"
            />
          ))}
        </main>
        <aside className="cv-kyoto__sidebar">
          <ContactList items={contactItems} className="cv-kyoto__contact" />
          <PersonalDetailsList items={personalDetails} className="cv-kyoto__personal-details" />
          {sidebar.map((section) => (
            <Section
              key={section.id}
              section={section}
              contentLanguage={data.contentLanguage}
              meterStyle={LAYOUT.meterStyle}
              className="cv-kyoto__section"
            />
          ))}
        </aside>
      </div>
    </div>
  );
}
