// Explicit React import — required even under the "react-jsx" automatic
// transform: workspace-symlinked packages consumed by tsx/esbuild across
// package boundaries do not reliably pick up this package's own tsconfig
// jsx setting, and can fall back to the classic transform (`React.createElement`),
// which throws `ReferenceError: React is not defined` without this import.
import React from "react";
import type { CvContentLanguage, RenderSection, SectionType } from "@cv-maker/contracts";
import { languageProficiencyPercent, resolveSectionTitle } from "@cv-maker/contracts";
import { formatDateRange } from "../layout/dates.js";
import {
  descriptiveLevelLabel,
  REFERENCES_AVAILABLE_LABEL,
  skillLevelLabel,
  WATERMARK_TEXT,
} from "../layout/i18n.js";
import { ContactIcon } from "../layout/icons.js";
import { entryClassNames, sectionClassNames } from "../layout/page-break.js";
import { Meter, skillLevelPercent, type MeterStyle } from "../layout/meter.js";
import { sectionShowsAvailableUponRequest } from "../layout/content.js";
import { type ContactItem, type PersonalDetailItem } from "../layout/personal.js";

/** Rich-text (Tiptap HTML) fields are sanitized server-side before they ever
 * reach this render path (see contracts/sections/timeline-entry.ts and
 * profile-summary.ts) — safe to inject directly, and this component is the
 * one place both the browser preview and the server-side (react-dom/server)
 * export do so, so there is exactly one trust boundary to reason about. */
export function RichText({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={["cv-richtext", className].filter(Boolean).join(" ")}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function SectionHeading({
  section,
  contentLanguage,
  className,
}: {
  section: RenderSection;
  contentLanguage: CvContentLanguage;
  className?: string;
}) {
  const title = resolveSectionTitle(section.type, contentLanguage, section.displayName);
  return <h2 className={["cv-section__title", className].filter(Boolean).join(" ")}>{title}</h2>;
}

export function ContactList({ items, className }: { items: ContactItem[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <ul className={["cv-contact-list", className].filter(Boolean).join(" ")}>
      {items.map((item) => (
        <li key={item.kind} className="cv-contact-list__item">
          <ContactIcon kind={item.kind} />
          <span>{item.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function PersonalDetailsList({
  items,
  className,
}: {
  items: PersonalDetailItem[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <dl className={["cv-personal-details", className].filter(Boolean).join(" ")}>
      {items.map((item) => (
        <div className="cv-personal-details__row" key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Photo({
  url,
  name,
  className,
}: {
  url: string | null | undefined;
  name: string;
  className?: string;
}) {
  if (!url) return null;
  return <img className={["cv-photo", className].filter(Boolean).join(" ")} src={url} alt={name} />;
}

/** A tasteful, low-opacity diagonal repeating watermark, built from plain
 * tiled DOM text (not a background-image data URI) so it renders identically
 * in the browser preview and in Puppeteer without any data-URI-escaping edge
 * cases. `position: fixed` repeats it on every printed page in paged media,
 * so a multi-page export stays watermarked throughout, not just page one. */
const WATERMARK_CELLS = Array.from({ length: 42 });

export function Watermark() {
  return (
    <div className="cv-watermark" aria-hidden="true">
      <div className="cv-watermark__grid">
        {WATERMARK_CELLS.map((_, index) => (
          <span className="cv-watermark__text" key={index}>
            {WATERMARK_TEXT}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Shared "job/degree/course" entry — the three timeline section types
 * (work experience, education, courses) all render through this one layout,
 * matching how similar those three forms already are on the content side. */
export function TimelineEntry({
  heading,
  subheading,
  city,
  dateRangeLabel,
  description,
  credentialUrl,
  className,
}: {
  heading: string;
  subheading: string;
  city?: string | null;
  dateRangeLabel: string;
  description?: string | null;
  credentialUrl?: string | null;
  className?: string;
}) {
  return (
    <article className={entryClassNames("cv-timeline-entry", className)}>
      <div className="cv-timeline-entry__head">
        <div>
          <h3 className="cv-timeline-entry__heading">{heading}</h3>
          <p className="cv-timeline-entry__subheading">
            {subheading}
            {city ? <span className="cv-timeline-entry__city"> · {city}</span> : null}
          </p>
        </div>
        <p className="cv-timeline-entry__dates">{dateRangeLabel}</p>
      </div>
      {description ? <RichText html={description} className="cv-timeline-entry__description" /> : null}
      {credentialUrl ? (
        <p className="cv-timeline-entry__credential">
          <ContactIcon kind="website" /> {credentialUrl}
        </p>
      ) : null}
    </article>
  );
}

export function SkillsList({
  section,
  meterStyle,
  lang,
}: {
  section: RenderSection;
  meterStyle: MeterStyle;
  lang: CvContentLanguage;
}) {
  const entries = section.skillEntries ?? [];
  if (entries.length === 0) return null;
  return (
    <ul className="cv-skills">
      {entries.map((skill) => (
        <li className="cv-skills__item" key={skill.id}>
          <span className="cv-skills__name">{skill.name}</span>
          <Meter
            percent={skillLevelPercent(skill.level)}
            style={meterStyle}
            label={skillLevelLabel(skill.level, lang)}
          />
        </li>
      ))}
    </ul>
  );
}

export function LanguagesList({
  section,
  meterStyle,
  lang,
}: {
  section: RenderSection;
  meterStyle: MeterStyle;
  lang: CvContentLanguage;
}) {
  const entries = section.languageEntries ?? [];
  if (entries.length === 0) return null;
  return (
    <ul className="cv-languages">
      {entries.map((entry) => {
        const percent = languageProficiencyPercent(entry.proficiency);
        const label =
          entry.proficiency.scale === "cefr"
            ? entry.proficiency.level
            : descriptiveLevelLabel(entry.proficiency.level, lang);
        return (
          <li className="cv-languages__item" key={entry.id}>
            <span className="cv-languages__name">{entry.languageName}</span>
            <Meter percent={percent} style={meterStyle} label={label} />
          </li>
        );
      })}
    </ul>
  );
}

export function HobbiesChips({ section }: { section: RenderSection }) {
  const entries = section.hobbyEntries ?? [];
  if (entries.length === 0) return null;
  return (
    <ul className="cv-hobbies">
      {entries.map((hobby) => (
        <li className="cv-hobbies__chip" key={hobby.id}>
          {hobby.name}
        </li>
      ))}
    </ul>
  );
}

export function ReferencesList({ section, lang }: { section: RenderSection; lang: CvContentLanguage }) {
  if (sectionShowsAvailableUponRequest(section)) {
    return <p className="cv-references__notice">{REFERENCES_AVAILABLE_LABEL[lang]}</p>;
  }
  const entries = section.referenceEntries ?? [];
  if (entries.length === 0) return null;
  return (
    <ul className="cv-references">
      {entries.map((reference) => (
        <li className={entryClassNames("cv-references__item")} key={reference.id}>
          <p className="cv-references__company">{reference.companyName}</p>
          <p className="cv-references__contact">{reference.contactPerson}</p>
          {reference.phone ? <p className="cv-references__meta">{reference.phone}</p> : null}
          {reference.email ? <p className="cv-references__meta">{reference.email}</p> : null}
        </li>
      ))}
    </ul>
  );
}

/** Dispatches a section's body by type — every template shares this so the
 * mapping from data → markup for a given section type never diverges between
 * Helsinki/Lisbon/Kyoto/Denver (only the surrounding chrome/CSS does). */
export function SectionBody({
  section,
  meterStyle,
  lang,
}: {
  section: RenderSection;
  meterStyle: MeterStyle;
  lang: CvContentLanguage;
}) {
  switch (section.type) {
    case "profile_summary":
    case "achievements":
    case "publications":
    case "custom":
      return section.freeformDescription ? <RichText html={section.freeformDescription} /> : null;
    case "work_experience":
      return (
        <div className="cv-timeline">
          {(section.workExperienceEntries ?? []).map((entry) => (
            <TimelineEntry
              key={entry.id}
              heading={entry.title}
              subheading={entry.employer}
              city={entry.city}
              dateRangeLabel={formatDateRange(entry.dateRange, lang)}
              description={entry.description}
            />
          ))}
        </div>
      );
    case "education":
      return (
        <div className="cv-timeline">
          {(section.educationEntries ?? []).map((entry) => (
            <TimelineEntry
              key={entry.id}
              heading={entry.degree}
              subheading={entry.school}
              city={entry.city}
              dateRangeLabel={formatDateRange(entry.dateRange, lang)}
              description={entry.description}
            />
          ))}
        </div>
      );
    case "courses":
      return (
        <div className="cv-timeline">
          {(section.courseEntries ?? []).map((entry) => (
            <TimelineEntry
              key={entry.id}
              heading={entry.courseName}
              subheading={entry.institution}
              city={entry.city}
              dateRangeLabel={formatDateRange(entry.dateRange, lang)}
              description={entry.description}
              credentialUrl={entry.credentialUrl}
            />
          ))}
        </div>
      );
    case "skills":
      return <SkillsList section={section} meterStyle={meterStyle} lang={lang} />;
    case "languages":
      return <LanguagesList section={section} meterStyle={meterStyle} lang={lang} />;
    case "hobbies":
      return <HobbiesChips section={section} />;
    case "references":
      return <ReferencesList section={section} lang={lang} />;
    default:
      return null;
  }
}

/** The section wrapper every template uses — attaches the page-break class
 * and renders the (already-visibility-checked) heading + body. */
export function Section({
  section,
  contentLanguage,
  meterStyle,
  className,
}: {
  section: RenderSection;
  contentLanguage: CvContentLanguage;
  meterStyle: MeterStyle;
  className?: string;
}) {
  return (
    <section className={sectionClassNames(section, "cv-section", className)}>
      <SectionHeading section={section} contentLanguage={contentLanguage} />
      <SectionBody section={section} meterStyle={meterStyle} lang={contentLanguage} />
    </section>
  );
}

/** Splits already-ordered, already-visible sections into "sidebar" vs "main"
 * groups for the two 2-column templates, preserving each group's relative
 * order. Which types go in the sidebar is part of the template's curated
 * design (features/17: templates are whole designs, not composable), not a
 * user setting. */
export function partitionSections(
  sections: RenderSection[],
  sidebarTypes: readonly SectionType[],
): { sidebar: RenderSection[]; main: RenderSection[] } {
  const sidebar: RenderSection[] = [];
  const main: RenderSection[] = [];
  for (const section of sections) {
    (sidebarTypes.includes(section.type) ? sidebar : main).push(section);
  }
  return { sidebar, main };
}
