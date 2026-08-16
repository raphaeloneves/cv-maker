import type { RenderSection } from "@cv-maker/contracts";

/** A rich-text (Tiptap HTML) field counts as empty if stripping tags leaves
 * nothing but whitespace — e.g. a Tiptap editor that was opened and closed
 * without typing anything often persists as "<p></p>". */
export function richTextHasContent(html: string | null | undefined): boolean {
  if (!html) return false;
  return html.replace(/<[^>]*>/g, "").trim().length > 0;
}

export function sectionShowsAvailableUponRequest(section: RenderSection): boolean {
  const value = section.settings?.["showAvailableUponRequest"];
  return typeof value === "boolean" ? value : false;
}

/** The caller already filtered out `hidden` sections — this is a second,
 * narrower check: does this *visible* section actually have anything to show?
 * An empty freeform section (achievements/publications/custom/profile with no
 * text) or a repeatable section with zero saved entries should render
 * nothing rather than an empty heading with a blank body underneath it. */
export function sectionHasContent(section: RenderSection): boolean {
  switch (section.type) {
    case "profile_summary":
    case "achievements":
    case "publications":
    case "custom":
      return richTextHasContent(section.freeformDescription);
    case "work_experience":
      return (section.workExperienceEntries?.length ?? 0) > 0;
    case "education":
      return (section.educationEntries?.length ?? 0) > 0;
    case "skills":
      return (section.skillEntries?.length ?? 0) > 0;
    case "hobbies":
      return (section.hobbyEntries?.length ?? 0) > 0;
    case "languages":
      return (section.languageEntries?.length ?? 0) > 0;
    case "courses":
      return (section.courseEntries?.length ?? 0) > 0;
    case "references":
      // The "available upon request" toggle is a legitimate, intentional
      // section body on its own — it must still render even with zero entries.
      return sectionShowsAvailableUponRequest(section) || (section.referenceEntries?.length ?? 0) > 0;
    default:
      return false;
  }
}
