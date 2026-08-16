# Feature: Achievements ("Conquistas")

## Summary

An optional section (added via the "+ extra section" mechanism) consisting of a single free-form rich-text block — no repeatable entries, no structured fields, just one open Description field for the whole section.

## Why this feature exists

Not every notable accomplishment fits neatly into a job entry, an award-with-a-date, or a bullet inside a role description — a hackathon win, a conference talk, an internal award, a patent, a notable metric someone is proud of. This section exists as a deliberately unstructured catch-all so a candidate can list a handful of standout accomplishments in whatever format suits them (a short paragraph, or — using the rich-text list tool — a bulleted list) without the overhead of creating multiple structured "entries."

## Observed behavior

- Added via "+ Adicione uma secção extra" as **"Conquistas."**
- A single field, labelled **"Descrição,"** with the same rich-text toolbar (B/I/U + ordered/unordered list) as Profile.
- A single **"Gravar"** (Save) button — no Tips button, no "add another" control, no per-entry Remove (removing the whole section is done via the shared section-settings gear icon, see `15-section-management.md`).
- Internally, this section type shares its underlying implementation (a single free-text block, "value: `availability`" observed in the option markup) with at least Publications — see the nuance below.

## Functional requirements (Gherkin)

```gherkin
Feature: Achievements
  As a job seeker
  I want an open, unstructured place to list notable accomplishments
  So that I can highlight standout achievements that don't fit neatly into
    a dated job/education entry

  Background:
    Given I have added the "Achievements" section to my CV via the
      "add an extra section" control

  Scenario: The section is a single free-text block
    Then I see one "Description" rich-text field and one "Save" control
    And there is no "add another entry" control — this is not a repeatable section

  Scenario: Formatting achievements as a list
    When I use the unordered-list formatting tool while writing
    Then I can present multiple achievements as distinct bullet points
      within the single Description field

  Scenario: Saving
    When I write content into Description and click "Save"
    Then the section shows a completion indicator
    And the content persists across navigation within the builder
```

## Nuances and edge cases to design for

- **This is the same underlying "single free-text section" primitive as Publications (`13-publications.md`) and Custom Sections (`14-custom-sections.md`)** — all three are, mechanically, "a named section with one rich-text Description field and a Save button." The only difference between them is the section's *name* and its *default position/icon* in the "add a section" menu. Our implementation should build **one** generic "freeform section" component/data-type and instantiate it three (or more) times with different presets, rather than three separately coded features — this mirrors the reference product's own apparent internal naming (the underlying option value observed for this section type was `availability`, an internal name that doesn't match its user-facing label "Conquistas" at all — a sign it's a generically-named, reused primitive under the hood).
- **Because it's unstructured, this section has no way to sort, filter, or otherwise programmatically use its content** (e.g. it can't feed a "years of experience" calculation the way dated entries could). That's an accepted tradeoff of the design, not an oversight — don't try to retrofit structure onto it.

## Opportunities (where we should improve on the reference)

1. Since this shares an implementation with Publications and Custom Sections, **make sure our internal naming is consistent and clear** (e.g. a `FreeformSection` type with a `presetLabel` and `presetIcon`), unlike the reference product's mismatched internal/external naming — this is purely an internal code-quality note, invisible to end users, but worth getting right from day one to avoid confusion as more preset section types are added later.
