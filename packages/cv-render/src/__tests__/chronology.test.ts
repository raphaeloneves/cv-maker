import { describe, expect, it } from "vitest";
import { compareDateRangesDescending, sortSectionChronologically } from "../layout/chronology.js";
import { baseSection, dateRange, presentRange, workExperienceEntry } from "./fixtures.js";

describe("compareDateRangesDescending", () => {
  it("sorts a present ('current job') entry before any dated entry", () => {
    const present = presentRange(2022, 1);
    const past = dateRange(2023, 1, 2023, 6); // starts/ends later in calendar time, but not "present"
    expect(compareDateRangesDescending(present, past)).toBeLessThan(0);
    expect(compareDateRangesDescending(past, present)).toBeGreaterThan(0);
  });

  it("sorts by end date descending when neither is present", () => {
    const older = dateRange(2015, 1, 2017, 6);
    const newer = dateRange(2018, 1, 2020, 3);
    expect(compareDateRangesDescending(newer, older)).toBeLessThan(0);
    expect(compareDateRangesDescending(older, newer)).toBeGreaterThan(0);
  });

  it("breaks ties on end date by start date descending", () => {
    const shorter = dateRange(2019, 6, 2020, 1); // started later
    const longer = dateRange(2017, 1, 2020, 1); // same end, started earlier
    expect(compareDateRangesDescending(shorter, longer)).toBeLessThan(0);
  });

  it("treats two identical ranges as equal", () => {
    const a = dateRange(2020, 1, 2021, 1);
    const b = dateRange(2020, 1, 2021, 1);
    expect(compareDateRangesDescending(a, b)).toBe(0);
  });
});

describe("sortSectionChronologically", () => {
  it("returns the section unchanged when organizeChronologically is false", () => {
    const oldest = workExperienceEntry({ dateRange: dateRange(2010, 1, 2011, 1) });
    const newest = workExperienceEntry({ dateRange: presentRange(2023, 1) });
    const section = baseSection({
      organizeChronologically: false,
      workExperienceEntries: [oldest, newest],
    });

    const result = sortSectionChronologically(section);

    expect(result).toBe(section); // no-op, not even a copy
    expect(result.workExperienceEntries).toEqual([oldest, newest]);
  });

  it("sorts work experience entries most-recent/present first when true", () => {
    const oldest = workExperienceEntry({ title: "Junior Dev", dateRange: dateRange(2010, 1, 2011, 1) });
    const middle = workExperienceEntry({ title: "Mid Dev", dateRange: dateRange(2011, 2, 2015, 1) });
    const current = workExperienceEntry({ title: "Staff Dev", dateRange: presentRange(2020, 1) });
    const section = baseSection({
      organizeChronologically: true,
      // deliberately entered out of chronological order, as a user might
      workExperienceEntries: [middle, oldest, current],
    });

    const result = sortSectionChronologically(section);

    expect(result.workExperienceEntries?.map((e) => e.title)).toEqual(["Staff Dev", "Mid Dev", "Junior Dev"]);
  });

  it("does not mutate the original entries array", () => {
    const oldest = workExperienceEntry({ dateRange: dateRange(2010, 1, 2011, 1) });
    const newest = workExperienceEntry({ dateRange: presentRange(2023, 1) });
    const original = [oldest, newest];
    const section = baseSection({ organizeChronologically: true, workExperienceEntries: original });

    sortSectionChronologically(section);

    expect(original).toEqual([oldest, newest]); // original array order untouched
  });

  it("leaves a section with no dated entries untouched", () => {
    const section = baseSection({ type: "skills", organizeChronologically: true, skillEntries: [] });
    const result = sortSectionChronologically(section);
    expect(result.workExperienceEntries).toBeUndefined();
  });
});
