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

const LAYOUT = templateLayoutFor("helsinki");

/** Sidebar hosts the "at a glance" sections; the main column carries the
 * narrative/dated content — a deliberate, curated split (features/17: whole
 * designs, not composable settings), not derived from user-set sort order. */
const SIDEBAR_TYPES: readonly SectionType[] = ["skills", "languages", "hobbies", "references"];

/** Helsinki: cool, confident, editorial — a full-bleed navy sidebar carrying
 * identity + at-a-glance facts, set in wide-tracked Syne capitals, next to a
 * calm white column of narrative content in Inter. */
export function HelsinkiTemplate({ data }: { data: CvRenderData }) {
  const name = fullName(data.personalInfo);
  const headline = deriveHeadline(data.sections);
  const contactItems = buildContactItems(data.personalInfo);
  const personalDetails = buildPersonalDetails(data.personalInfo, data.contentLanguage);
  const sections = prepareSections(data.sections);
  const { sidebar, main } = partitionSections(sections, SIDEBAR_TYPES);

  return (
    <div
      className="cv-document cv-document--helsinki"
      style={{ ["--accent" as string]: data.accentColor }}
    >
      {data.watermarked ? <Watermark /> : null}
      <div className="cv-helsinki__page">
        <aside className="cv-helsinki__sidebar">
          <div className="cv-helsinki__identity">
            <Photo url={data.personalInfo?.photoUrl} name={name} className="cv-helsinki__photo" />
            {name ? <h1 className="cv-helsinki__name">{name}</h1> : null}
            {headline ? <p className="cv-helsinki__headline">{headline}</p> : null}
          </div>
          <ContactList items={contactItems} className="cv-helsinki__contact" />
          <PersonalDetailsList items={personalDetails} className="cv-helsinki__personal-details" />
          {sidebar.map((section) => (
            <Section
              key={section.id}
              section={section}
              contentLanguage={data.contentLanguage}
              meterStyle={LAYOUT.meterStyle}
              className="cv-helsinki__section"
            />
          ))}
        </aside>
        <main className="cv-helsinki__main">
          {main.map((section) => (
            <Section
              key={section.id}
              section={section}
              contentLanguage={data.contentLanguage}
              meterStyle={LAYOUT.meterStyle}
              className="cv-helsinki__section"
            />
          ))}
        </main>
      </div>
    </div>
  );
}
