import type { Section } from "@cv-maker/contracts";
import { TimelineEntrySection, type TimelineFieldsConfig } from "@/domains/sections/TimelineEntrySection.js";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";

/** Thin configuration of the generic TimelineEntrySection for
 * work_experience — see features/05-work-experience.md. */
export function WorkExperienceSection({ section }: { section: Section }) {
  const locale = useBuilderLocale();
  const fields: TimelineFieldsConfig = {
    primaryKey: "title",
    secondaryKey: "employer",
    primaryLabel: t(locale, "workExperience.title"),
    secondaryLabel: t(locale, "workExperience.employer"),
    primaryPlaceholder: t(locale, "workExperience.titlePlaceholder"),
    cityLabel: t(locale, "common.city"),
    descriptionLabel: t(locale, "common.description"),
    addLabel: t(locale, "workExperience.add"),
  };
  return <TimelineEntrySection section={section} kind="work-experience" fields={fields} />;
}
