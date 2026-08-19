// Explicit React import — required even under the "react-jsx" automatic
// transform: workspace-symlinked packages consumed by tsx/esbuild across
// package boundaries do not reliably pick up this package's own tsconfig
// jsx setting, and can fall back to the classic transform (`React.createElement`),
// which throws `ReferenceError: React is not defined` without this import.
import React from "react";
import type { CvContentLanguage, CvRenderData, RenderSection } from "@cv-maker/contracts";
import { templateLayoutFor } from "../layout/definition.js";
import { prepareSections } from "../layout/prepare.js";
import { buildContactItems, fullName } from "../layout/personal.js";
import { formatDateRange } from "../layout/dates.js";
import { entryClassNames, sectionClassNames } from "../layout/page-break.js";
import { ContactList, Section, SectionHeading, TimelineEntry, Watermark } from "./shared.js";

const LAYOUT = templateLayoutFor("faro");

type WorkExperienceEntry = NonNullable<RenderSection["workExperienceEntries"]>[number];

/** One condensed line for an older role: title — employer on the left, dates
 * right-aligned, no bullets. This, plus one fully-detailed entry above it, is
 * what lets a long career history still land on a single page. */
function CondensedExperienceRow({
  entry,
  contentLanguage,
}: {
  entry: WorkExperienceEntry;
  contentLanguage: CvContentLanguage;
}) {
  return (
    <div className={entryClassNames("cv-faro-condensed")}>
      <span className="cv-faro-condensed__title">
        <span className="cv-faro-condensed__role">{entry.title}</span>
        <span className="cv-faro-condensed__employer"> — {entry.employer}</span>
      </span>
      <span className="cv-faro-condensed__dates">{formatDateRange(entry.dateRange, contentLanguage)}</span>
    </div>
  );
}

/** The one section Faro treats differently from the shared body dispatch:
 * the first work experience entry (whatever order the CV is already in —
 * this never re-sorts) keeps full narrative detail, every entry after it
 * condenses to a single line. Every other section type still goes through
 * the shared `<Section>`/`SectionBody` path unchanged. */
function ExperienceSection({
  section,
  contentLanguage,
}: {
  section: RenderSection;
  contentLanguage: CvContentLanguage;
}) {
  const entries = section.workExperienceEntries ?? [];
  const first = entries[0];
  if (!first) return null;
  const rest = entries.slice(1);

  return (
    <section className={sectionClassNames(section, "cv-section", "cv-faro__section")}>
      <SectionHeading section={section} contentLanguage={contentLanguage} />
      <div className="cv-timeline">
        <TimelineEntry
          heading={first.title}
          subheading={first.employer}
          city={first.city}
          dateRangeLabel={formatDateRange(first.dateRange, contentLanguage)}
          description={first.description}
        />
        {rest.length > 0 ? (
          <div className="cv-faro-condensed-list">
            {rest.map((entry) => (
              <CondensedExperienceRow key={entry.id} entry={entry} contentLanguage={contentLanguage} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Faro: Porto's one-page companion — same quiet, text-first design, but the
 * career story compresses instead of sprawling: one role in full, the rest
 * as a scan-friendly list. Premium. */
export function FaroTemplate({ data }: { data: CvRenderData }) {
  const name = fullName(data.personalInfo);
  const contactItems = buildContactItems(data.personalInfo);
  const sections = prepareSections(data.sections);

  return (
    <div className="cv-document cv-document--faro" style={{ ["--accent" as string]: data.accentColor }}>
      {data.watermarked ? <Watermark /> : null}
      <div className="cv-faro__page">
        <header className="cv-faro__header">
          {name ? <h1 className="cv-faro__name">{name}</h1> : null}
          <ContactList items={contactItems} className="cv-faro__contact" />
        </header>
        <main className="cv-faro__main">
          {sections.map((section) =>
            section.type === "work_experience" ? (
              <ExperienceSection key={section.id} section={section} contentLanguage={data.contentLanguage} />
            ) : (
              <Section
                key={section.id}
                section={section}
                contentLanguage={data.contentLanguage}
                meterStyle={LAYOUT.meterStyle}
                className="cv-faro__section"
              />
            ),
          )}
        </main>
      </div>
    </div>
  );
}
