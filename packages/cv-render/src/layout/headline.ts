import type { RenderSection } from "@cv-maker/contracts";
import { compareDateRangesDescending } from "./chronology.js";

/** A short role tagline under the candidate's name — most CV templates show
 * one, and the most natural source already present in the data is the job
 * title of the most recent (or current) work-experience entry. Regardless of
 * whether the section itself is set to `organizeChronologically`, this always
 * looks at the most-recent entry by date, since it's answering "what does
 * this person do *now*," not reflecting manual entry order. Returns null when
 * there is no work-experience section or it has no entries. */
export function deriveHeadline(sections: RenderSection[]): string | null {
  const workSection = sections.find(
    (section) => section.type === "work_experience" && (section.workExperienceEntries?.length ?? 0) > 0,
  );
  const entries = workSection?.workExperienceEntries;
  if (!entries || entries.length === 0) return null;

  const mostRecent = [...entries].sort((a, b) => compareDateRangesDescending(a.dateRange, b.dateRange))[0];
  return mostRecent?.title ?? null;
}
