import type { RenderSection } from "@cv-maker/contracts";

/** Class applied to a section wrapper so it always starts at the top of a new
 * page in print/export — the CSS rule (`break-before: page`) lives in
 * styles.css; this just decides *whether* to attach it. */
export const SECTION_BREAK_BEFORE_CLASS = "cv-section--break-before";

/** Class applied to every entry wrapper (job, degree, course, reference...) so
 * print/export never splits a single entry awkwardly across a page boundary
 * (`break-inside: avoid` in styles.css). Unconditional — unlike the
 * section-level break, this always applies. */
export const ENTRY_AVOID_BREAK_CLASS = "cv-entry";

export function sectionBreakClassName(section: Pick<RenderSection, "forcePageBreak">): string {
  return section.forcePageBreak ? SECTION_BREAK_BEFORE_CLASS : "";
}

/** Joins a section's own base class name(s) with the conditional page-break
 * class, skipping empty pieces — the one place both call sites (preview,
 * export) build a section wrapper's className so the two never drift. */
export function sectionClassNames(
  section: Pick<RenderSection, "forcePageBreak">,
  ...baseClassNames: Array<string | false | null | undefined>
): string {
  return [...baseClassNames, sectionBreakClassName(section)].filter(Boolean).join(" ");
}

/** Joins an entry's always-on avoid-break class with any template-specific
 * base classes. */
export function entryClassNames(...baseClassNames: Array<string | false | null | undefined>): string {
  return [ENTRY_AVOID_BREAK_CLASS, ...baseClassNames].filter(Boolean).join(" ");
}
