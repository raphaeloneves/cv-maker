import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Cv, CvContentLanguage, CvRenderData, Section, UpdateSection } from "@cv-maker/contracts";
import { apiGet } from "@/lib/api-client";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";
import { useSections } from "./useSections.js";
import { useEntryCount } from "./useEntryCount.js";
import { SectionShell } from "./SectionShell.js";
import { SortableEntryList } from "./SortableEntryList.js";
import { AddSectionControl } from "./AddSectionControl.js";
import { FreeformSection } from "@/domains/freeform-sections/FreeformSection.js";
import { WorkExperienceSection } from "@/domains/work-experience/WorkExperienceSection.js";
import { EducationSection } from "@/domains/education/EducationSection.js";
import { CourseSection } from "@/domains/courses/CourseSection.js";
import { SkillsSection } from "@/domains/skills/SkillsSection.js";
import { LanguagesSection } from "@/domains/languages/LanguagesSection.js";
import { HobbiesSection } from "@/domains/hobbies/HobbiesSection.js";
import { ReferencesSection } from "@/domains/references/ReferencesSection.js";

interface ContentBuilderProps {
  cvId: string;
}

/** Root orchestrator for the `/builder/content` step: fetches the CV shell
 * (for `contentLanguage`), the section list, and hydrates freeform section
 * content from `GET /cvs/:cvId/render-data` (the sections list endpoint,
 * per docs/api-routes.md, returns section metadata only — render data is
 * the one documented endpoint that also carries each freeform section's
 * current `description`, so it doubles as the freeform hydration source
 * here). Renders the drag-reorderable section list, dispatching each
 * section to its type-specific component, plus "+ Add a section". */
export function ContentBuilder({ cvId }: ContentBuilderProps) {
  const locale = useBuilderLocale();
  const { sections, isLoading, updateSection, removeSection, reorderSections, createSection } = useSections(cvId);

  const cvQuery = useQuery({
    queryKey: ["cv", cvId],
    queryFn: () => apiGet<Cv>(`/cvs/${cvId}`),
  });

  const renderDataQuery = useQuery({
    queryKey: ["cv-render-data", cvId],
    queryFn: () => apiGet<CvRenderData>(`/cvs/${cvId}/render-data`),
  });

  const freeformBySectionId = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const s of renderDataQuery.data?.sections ?? []) {
      if (s.freeformDescription !== undefined) map[s.id] = s.freeformDescription ?? null;
    }
    return map;
  }, [renderDataQuery.data]);

  const contentLanguage: CvContentLanguage = cvQuery.data?.contentLanguage ?? "en";
  const ids = sections.map((s) => s.id);

  if (isLoading) {
    return <p className="text-sm text-text-muted">{t(locale, "content.loading")}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <SortableEntryList ids={ids} onReorder={(next) => void reorderSections(next)} className="flex flex-col gap-4">
        {sections.map((section) => (
          <SectionListItem
            key={section.id}
            section={section}
            contentLanguage={contentLanguage}
            freeformDescription={freeformBySectionId[section.id] ?? null}
            onUpdate={(body) => updateSection(section.id, body)}
            onRemove={section.deletable ? () => removeSection(section.id) : undefined}
          />
        ))}
      </SortableEntryList>

      <AddSectionControl existingSections={sections} contentLanguage={contentLanguage} onAdd={createSection} />
    </div>
  );
}

function SectionListItem({
  section,
  contentLanguage,
  freeformDescription,
  onUpdate,
  onRemove,
}: {
  section: Section;
  contentLanguage: CvContentLanguage;
  freeformDescription: string | null;
  onUpdate: (body: UpdateSection) => Promise<unknown>;
  onRemove?: () => Promise<unknown>;
}) {
  const entryCount = useEntryCount(section.type, section.id);
  const locale = useBuilderLocale();

  return (
    <SectionShell
      section={section}
      contentLanguage={contentLanguage}
      entryCount={entryCount}
      onUpdate={onUpdate}
      onRemove={onRemove}
    >
      {section.type === "profile_summary" && (
        <FreeformSection
          sectionId={section.id}
          initialDescription={freeformDescription}
          ariaLabel={t(locale, "profileSummary.description")}
          tips={[t(locale, "profileSummary.tips.1"), t(locale, "profileSummary.tips.2"), t(locale, "profileSummary.tips.3")]}
        />
      )}
      {(section.type === "achievements" || section.type === "publications" || section.type === "custom") && (
        <FreeformSection sectionId={section.id} initialDescription={freeformDescription} ariaLabel={t(locale, "common.description")} />
      )}
      {section.type === "work_experience" && <WorkExperienceSection section={section} />}
      {section.type === "education" && <EducationSection section={section} />}
      {section.type === "courses" && <CourseSection section={section} />}
      {section.type === "skills" && <SkillsSection section={section} />}
      {section.type === "languages" && <LanguagesSection section={section} />}
      {section.type === "hobbies" && <HobbiesSection section={section} />}
      {section.type === "references" && <ReferencesSection section={section} onUpdate={onUpdate} />}
    </SectionShell>
  );
}
