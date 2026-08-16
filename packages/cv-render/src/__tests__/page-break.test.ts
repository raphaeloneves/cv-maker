import { describe, expect, it } from "vitest";
import {
  ENTRY_AVOID_BREAK_CLASS,
  SECTION_BREAK_BEFORE_CLASS,
  entryClassNames,
  sectionBreakClassName,
  sectionClassNames,
} from "../layout/page-break.js";

describe("sectionBreakClassName", () => {
  it("returns the break-before class when forcePageBreak is true", () => {
    expect(sectionBreakClassName({ forcePageBreak: true })).toBe(SECTION_BREAK_BEFORE_CLASS);
  });

  it("returns an empty string when forcePageBreak is false", () => {
    expect(sectionBreakClassName({ forcePageBreak: false })).toBe("");
  });
});

describe("sectionClassNames", () => {
  it("joins base classes with the break class when forced", () => {
    const result = sectionClassNames({ forcePageBreak: true }, "cv-section", "cv-helsinki__section");
    expect(result).toBe(`cv-section cv-helsinki__section ${SECTION_BREAK_BEFORE_CLASS}`);
  });

  it("omits the break class entirely (no trailing space) when not forced", () => {
    const result = sectionClassNames({ forcePageBreak: false }, "cv-section", "cv-helsinki__section");
    expect(result).toBe("cv-section cv-helsinki__section");
  });

  it("filters out falsy/undefined base class names", () => {
    const result = sectionClassNames({ forcePageBreak: false }, "cv-section", false, undefined, null);
    expect(result).toBe("cv-section");
  });
});

describe("entryClassNames", () => {
  it("always includes the avoid-break class regardless of any flag", () => {
    expect(entryClassNames()).toBe(ENTRY_AVOID_BREAK_CLASS);
    expect(entryClassNames("cv-timeline-entry")).toBe(`${ENTRY_AVOID_BREAK_CLASS} cv-timeline-entry`);
  });
});
