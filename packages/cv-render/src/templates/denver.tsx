// Explicit React import — required even under the "react-jsx" automatic
// transform: workspace-symlinked packages consumed by tsx/esbuild across
// package boundaries do not reliably pick up this package's own tsconfig
// jsx setting, and can fall back to the classic transform (`React.createElement`),
// which throws `ReferenceError: React is not defined` without this import.
import React from "react";
import type { CvRenderData } from "@cv-maker/contracts";
import { templateLayoutFor } from "../layout/definition.js";
import { deriveHeadline } from "../layout/headline.js";
import { prepareSections } from "../layout/prepare.js";
import { buildContactItems, buildPersonalDetails, fullName } from "../layout/personal.js";
import { ContactList, Photo, PersonalDetailsList, Section, Watermark } from "./shared.js";

const LAYOUT = templateLayoutFor("denver");

/** Denver: bold, contemporary, single-column — a full-width accent-colored
 * header band with a circular photo and oversized name, then one confident
 * column below with heavy rule dividers and gradient-filled bar meters.
 * Premium. */
export function DenverTemplate({ data }: { data: CvRenderData }) {
  const name = fullName(data.personalInfo);
  const headline = deriveHeadline(data.sections);
  const contactItems = buildContactItems(data.personalInfo);
  const personalDetails = buildPersonalDetails(data.personalInfo, data.contentLanguage);
  const sections = prepareSections(data.sections);

  return (
    <div className="cv-document cv-document--denver" style={{ ["--accent" as string]: data.accentColor }}>
      {data.watermarked ? <Watermark /> : null}
      <div className="cv-denver__page">
        <header className="cv-denver__header">
          <Photo url={data.personalInfo?.photoUrl} name={name} className="cv-denver__photo" />
          <div className="cv-denver__heading-block">
            {name ? <h1 className="cv-denver__name">{name}</h1> : null}
            {headline ? <p className="cv-denver__headline">{headline}</p> : null}
          </div>
          <ContactList items={contactItems} className="cv-denver__contact" />
        </header>
        <PersonalDetailsList items={personalDetails} className="cv-denver__personal-details" />
        <main className="cv-denver__main">
          {sections.map((section) => (
            <Section
              key={section.id}
              section={section}
              contentLanguage={data.contentLanguage}
              meterStyle={LAYOUT.meterStyle}
              className="cv-denver__section"
            />
          ))}
        </main>
      </div>
    </div>
  );
}
