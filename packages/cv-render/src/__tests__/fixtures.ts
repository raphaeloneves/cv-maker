import type { DateRange, RenderSection, WorkExperienceEntry } from "@cv-maker/contracts";

let counter = 0;
function nextId(): string {
  counter += 1;
  return `00000000-0000-4000-8000-${String(counter).padStart(12, "0")}`;
}

export function fullDate(year: number, month: number): { granularity: "full"; year: number; month: number } {
  return { granularity: "full", year, month };
}

export function presentRange(startYear: number, startMonth: number): DateRange {
  return { start: fullDate(startYear, startMonth), end: { isPresent: true } };
}

export function dateRange(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
): DateRange {
  return {
    start: fullDate(startYear, startMonth),
    end: { isPresent: false, granularity: "full", year: endYear, month: endMonth },
  };
}

export function workExperienceEntry(overrides: Partial<WorkExperienceEntry> = {}): WorkExperienceEntry {
  const id = nextId();
  return {
    id,
    sectionId: "section-1",
    title: "Software Engineer",
    employer: "Acme Corp",
    city: "Lisbon",
    dateRange: dateRange(2019, 1, 2020, 1),
    description: null,
    sortOrder: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function baseSection(overrides: Partial<RenderSection> = {}): RenderSection {
  return {
    id: nextId(),
    cvId: "cv-1",
    type: "work_experience",
    displayName: null,
    sortOrder: 0,
    hidden: false,
    forcePageBreak: false,
    organizeChronologically: false,
    deletable: true,
    settings: {},
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}
