import type { Section } from "@cv-maker/contracts";
import { TimelineEntrySection, type TimelineFieldsConfig } from "@/domains/sections/TimelineEntrySection.js";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";

/** Thin configuration of the generic TimelineEntrySection for education —
 * see features/06-education-qualifications.md. */
export function EducationSection({ section }: { section: Section }) {
  const locale = useBuilderLocale();
  const fields: TimelineFieldsConfig = {
    primaryKey: "degree",
    secondaryKey: "school",
    primaryLabel: t(locale, "education.degree"),
    secondaryLabel: t(locale, "education.school"),
    primaryPlaceholder: t(locale, "education.degreePlaceholder"),
    cityLabel: t(locale, "common.city"),
    descriptionLabel: t(locale, "common.description"),
    addLabel: t(locale, "education.add"),
  };
  return <TimelineEntrySection section={section} kind="education" fields={fields} />;
}
