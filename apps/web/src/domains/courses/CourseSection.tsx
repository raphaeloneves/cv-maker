import type { Section } from "@cv-maker/contracts";
import { TimelineEntrySection, type TimelineFieldsConfig } from "@/domains/sections/TimelineEntrySection.js";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";

/** Thin configuration of the generic TimelineEntrySection for courses —
 * see features/11-courses-certifications.md. `credentialUrl` is the one
 * field beyond the shared timeline shape, wired via `extra`. */
export function CourseSection({ section }: { section: Section }) {
  const locale = useBuilderLocale();
  const fields: TimelineFieldsConfig = {
    primaryKey: "courseName",
    secondaryKey: "institution",
    primaryLabel: t(locale, "courses.courseName"),
    secondaryLabel: t(locale, "courses.institution"),
    primaryPlaceholder: t(locale, "courses.courseNamePlaceholder"),
    cityLabel: t(locale, "common.city"),
    descriptionLabel: t(locale, "common.description"),
    addLabel: t(locale, "courses.add"),
    extra: {
      key: "credentialUrl",
      label: t(locale, "courses.credentialUrl"),
      placeholder: "https://",
    },
  };
  return <TimelineEntrySection section={section} kind="courses" fields={fields} />;
}
