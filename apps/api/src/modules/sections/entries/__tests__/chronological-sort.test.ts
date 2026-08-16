import { describe, expect, it } from "vitest";
import type { DateRange } from "@cv-maker/contracts";
import { sortByDateRangeDesc } from "../chronological-sort.js";

function entry(id: string, dateRange: DateRange) {
  return { id, dateRange };
}

describe("sortByDateRangeDesc", () => {
  it("puts a Present entry first, ahead of any dated entry no matter how recent", () => {
    const entries = [
      entry("older", { start: { granularity: "year_only", year: 2010 }, end: { isPresent: false, granularity: "year_only", year: 2015 } }),
      entry("present", { start: { granularity: "year_only", year: 2023 }, end: { isPresent: true } }),
      entry("newer", { start: { granularity: "year_only", year: 2020 }, end: { isPresent: false, granularity: "year_only", year: 2024 } }),
    ];
    const sorted = sortByDateRangeDesc(entries);
    expect(sorted.map((e) => e.id)).toEqual(["present", "newer", "older"]);
  });

  it("orders dated entries most-recent-first by end year/month", () => {
    const entries = [
      entry("a", { start: { granularity: "full", month: 1, year: 2018 }, end: { isPresent: false, granularity: "full", month: 6, year: 2019 } }),
      entry("b", { start: { granularity: "full", month: 1, year: 2020 }, end: { isPresent: false, granularity: "full", month: 1, year: 2022 } }),
      entry("c", { start: { granularity: "full", month: 1, year: 2019 }, end: { isPresent: false, granularity: "full", month: 12, year: 2019 } }),
    ];
    const sorted = sortByDateRangeDesc(entries);
    expect(sorted.map((e) => e.id)).toEqual(["b", "c", "a"]);
  });

  it("does not mutate the input array", () => {
    const entries = [
      entry("a", { start: { granularity: "year_only", year: 2010 }, end: { isPresent: true } }),
      entry("b", { start: { granularity: "year_only", year: 2020 }, end: { isPresent: false, granularity: "year_only", year: 2021 } }),
    ];
    const copy = [...entries];
    sortByDateRangeDesc(entries);
    expect(entries).toEqual(copy);
  });
});
