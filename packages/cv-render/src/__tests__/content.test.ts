import { describe, expect, it } from "vitest";
import { richTextHasContent, sectionHasContent } from "../layout/content.js";
import { baseSection, workExperienceEntry } from "./fixtures.js";

describe("richTextHasContent", () => {
  it("treats null/undefined/empty-tag content as empty", () => {
    expect(richTextHasContent(null)).toBe(false);
    expect(richTextHasContent(undefined)).toBe(false);
    expect(richTextHasContent("")).toBe(false);
    expect(richTextHasContent("<p></p>")).toBe(false);
    expect(richTextHasContent("<p>   </p>")).toBe(false);
  });

  it("treats real text as non-empty", () => {
    expect(richTextHasContent("<p>Hello</p>")).toBe(true);
  });
});

describe("sectionHasContent", () => {
  it("is false for a freeform section with no real text", () => {
    const section = baseSection({ type: "achievements", freeformDescription: "<p></p>" });
    expect(sectionHasContent(section)).toBe(false);
  });

  it("is true for a freeform section with real text", () => {
    const section = baseSection({ type: "custom", freeformDescription: "<p>Open source work</p>" });
    expect(sectionHasContent(section)).toBe(true);
  });

  it("is false for a repeatable section with zero entries", () => {
    const section = baseSection({ type: "work_experience", workExperienceEntries: [] });
    expect(sectionHasContent(section)).toBe(false);
  });

  it("is true for a repeatable section with at least one entry", () => {
    const section = baseSection({ type: "work_experience", workExperienceEntries: [workExperienceEntry()] });
    expect(sectionHasContent(section)).toBe(true);
  });

  it("is true for references showing 'available upon request' even with zero entries", () => {
    const section = baseSection({
      type: "references",
      referenceEntries: [],
      settings: { showAvailableUponRequest: true },
    });
    expect(sectionHasContent(section)).toBe(true);
  });
});
