import { describe, expect, it } from "vitest";
import type { DateRange } from "@cv-maker/contracts";
import { columnsToDateRange, dateRangeToColumns } from "../date-mapping.js";

describe("date-mapping", () => {
  it("round-trips a full start date with an isPresent=true end (never a sentinel year)", () => {
    const range: DateRange = {
      start: { granularity: "full", month: 6, year: 2020 },
      end: { isPresent: true },
    };
    const columns = dateRangeToColumns(range);
    expect(columns).toMatchObject({
      startGranularity: "FULL",
      startMonth: 6,
      startYear: 2020,
      endIsPresent: true,
      endGranularity: null,
      endMonth: null,
      endYear: null,
    });
    expect(columnsToDateRange(columns as never)).toEqual(range);
  });

  it("round-trips a year_only start with a dated, non-present end", () => {
    const range: DateRange = {
      start: { granularity: "year_only", year: 2015 },
      end: { isPresent: false, granularity: "full", month: 3, year: 2018 },
    };
    const columns = dateRangeToColumns(range);
    expect(columnsToDateRange(columns as never)).toEqual(range);
  });

  it("round-trips a hidden-granularity start and end", () => {
    const range: DateRange = {
      start: { granularity: "hidden", year: 1999 },
      end: { isPresent: false, granularity: "hidden", year: 2001 },
    };
    const columns = dateRangeToColumns(range);
    expect(columnsToDateRange(columns as never)).toEqual(range);
  });

  it("never sets a start month for year_only or hidden granularity", () => {
    const range: DateRange = {
      start: { granularity: "year_only", year: 2010 },
      end: { isPresent: true },
    };
    const columns = dateRangeToColumns(range);
    expect(columns.startMonth).toBeNull();
  });
});
