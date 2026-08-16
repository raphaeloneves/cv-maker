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

const LAYOUT = templateLayoutFor("lisbon");

/** Lisbon: warm, single-column, editorial — a quiet horizontal header (photo
 * inline-left of the name block) then one continuous readable column, accent
 * used sparingly as a rule under each section title and as dot-meter fills. */
export function LisbonTemplate({ data }: { data: CvRenderData }) {
  const name = fullName(data.personalInfo);
  const headline = deriveHeadline(data.sections);
  const contactItems = buildContactItems(data.personalInfo);
  const personalDetails = buildPersonalDetails(data.personalInfo, data.contentLanguage);
  const sections = prepareSections(data.sections);

  return (
    <div className="cv-document cv-document--lisbon" style={{ ["--accent" as string]: data.accentColor }}>
      {data.watermarked ? <Watermark /> : null}
      <div className="cv-lisbon__page">
        <header className="cv-lisbon__header">
          <Photo url={data.personalInfo?.photoUrl} name={name} className="cv-lisbon__photo" />
          <div className="cv-lisbon__heading-block">
            {name ? <h1 className="cv-lisbon__name">{name}</h1> : null}
            {headline ? <p className="cv-lisbon__headline">{headline}</p> : null}
            <ContactList items={contactItems} className="cv-lisbon__contact" />
          </div>
        </header>
        <PersonalDetailsList items={personalDetails} className="cv-lisbon__personal-details" />
        <main className="cv-lisbon__main">
          {sections.map((section) => (
            <Section
              key={section.id}
              section={section}
              contentLanguage={data.contentLanguage}
              meterStyle={LAYOUT.meterStyle}
              className="cv-lisbon__section"
            />
          ))}
        </main>
      </div>
    </div>
  );
}
