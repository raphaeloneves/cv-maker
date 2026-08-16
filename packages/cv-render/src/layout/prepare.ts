import type { RenderSection } from "@cv-maker/contracts";
import { sortSectionChronologically } from "./chronology.js";
import { sectionHasContent } from "./content.js";

/** The one pipeline every template runs `data.sections` through before
 * rendering: apply chronological sort where requested, then drop any
 * (already non-hidden) section that has nothing to show. Centralizing this
 * here is what guarantees the browser preview and the server-side PDF export
 * can never disagree on ordering or on which sections render. */
export function prepareSections(sections: RenderSection[]): RenderSection[] {
  return sections.map(sortSectionChronologically).filter(sectionHasContent);
}
