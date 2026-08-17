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
import { ContactList, Photo, PersonalDetailsList, Section, Watermark, partitionSections } from "./shared.js";

const LAYOUT = templateLayoutFor("marrakech");

const SIDEBAR_TYPES: readonly SectionType[] = ["skills", "languages", "hobbies", "references"];

/** Marrakech: warm, bold, geometric — a full-bleed color header band with a
 * large overlapping circular photo, then a wide main column beside a tinted,
 * card-like sidebar carrying at-a-glance facts as bar meters. Premium. */
export function MarrakechTemplate({ data }: { data: CvRenderData }) {
  const name = fullName(data.personalInfo);
  const headline = deriveHeadline(data.sections);
  const contactItems = buildContactItems(data.personalInfo);
  const personalDetails = buildPersonalDetails(data.personalInfo, data.contentLanguage);
  const sections = prepareSections(data.sections);
  const { sidebar, main } = partitionSections(sections, SIDEBAR_TYPES);

  return (
    <div
      className="cv-document cv-document--marrakech"
      style={{ ["--accent" as string]: data.accentColor }}
    >
      {data.watermarked ? <Watermark /> : null}
      <div className="cv-marrakech__page">
        <header className="cv-marrakech__header">
          <Photo url={data.personalInfo?.photoUrl} name={name} className="cv-marrakech__photo" />
          <div className="cv-marrakech__heading-block">
            {name ? <h1 className="cv-marrakech__name">{name}</h1> : null}
            {headline ? <p className="cv-marrakech__headline">{headline}</p> : null}
          </div>
        </header>
        <div className="cv-marrakech__body">
          <main className="cv-marrakech__main">
            {main.map((section) => (
              <Section
                key={section.id}
                section={section}
                contentLanguage={data.contentLanguage}
                meterStyle={LAYOUT.meterStyle}
                className="cv-marrakech__section"
              />
            ))}
          </main>
          <aside className="cv-marrakech__sidebar">
            <ContactList items={contactItems} className="cv-marrakech__contact" />
            <PersonalDetailsList items={personalDetails} className="cv-marrakech__personal-details" />
            {sidebar.map((section) => (
              <Section
                key={section.id}
                section={section}
                contentLanguage={data.contentLanguage}
                meterStyle={LAYOUT.meterStyle}
                className="cv-marrakech__section"
              />
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
