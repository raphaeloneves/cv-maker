# Feature: Work Experience History

## Summary

A repeatable section where the user documents each past job: title, employer, location, start/end dates, and a free-text description of what they did. This is usually the section that occupies the most space on a finished CV and does the most work in convincing an employer to grant an interview.

## Why this feature exists

Employers scan work history to answer three questions fast: *what did you do, where, and for how long.* The feature must make it trivially easy to add multiple jobs, reorder them if needed, and — critically — express *ongoing* employment and *partial* dates naturally, since forcing users into an unnatural "fake end date" for their current job is one of the most common frustrations with rigid CV-builder date pickers.

## Observed behavior

- Section header: **"Experiência profissional"**, briefcase icon, standard reorder-arrows + settings-gear controls shared by every section.
- Fields per entry: **Cargo** (Job title), **Cidade/Localidade** (City), **Empregador** (Employer), **Data de Início** (Start date), **Data de Término** (End date), **Descrição** (rich-text, same B/I/U + list toolbar as Profile).
- **"+ Adicionar outra experiência profissional"** ("+ Add another professional experience") appends a new, blank entry form below the existing ones — the section supports an unlimited number of entries.
- Each entry has its own **"Dicas"** (Tips), **"Remover"** (Remove), and **"Gravar"** (Save) controls, all scoped to that single entry.
- **Dates are two independent [Month, Year] pairs**, each rendered as two `<select>` dropdowns.
  - The **month** dropdown for both start and end includes two special non-month options in addition to the 12 months: **"Não mostrar"** ("Don't show" — omits the month from the printed date, showing year only for that endpoint) and **"Exibir apenas o ano"** (this literal label also drives year-only display — the reference UI appears to offer this as a semantically distinct/duplicate option to "Não mostrar"; both collapse the granularity to year-only for that date. This nuance is worth clarifying with direct product testing rather than assuming; see Open questions).
  - The **end-date month dropdown additionally includes "Presente"** ("Present"). Selecting it removes the end-year selector entirely from the form (there is nothing to pick — "Present" has no year) and the entry's summary line renders as e.g. **"setembro 2018 - Presente."**
  - The year range spans from the current year backward to 1948 for start dates observed in this walkthrough (matching a plausible working-age population), confirmed going up to the current year.
- Once saved, each entry collapses into a compact summary row showing **job title (bold) and the date range** underneath, with three icons on the right: **✕ (delete)**, **✏️ (edit — re-expands the full form)**, **☰ (drag handle for manual reordering)**.
- New entries default their start/end month+year to the **current month and year** (a sensible "fill in something plausible, easy to change" default rather than leaving the selects on an obviously-empty placeholder state).

## Functional requirements (Gherkin)

```gherkin
Feature: Work experience history
  As a job seeker
  I want to list each of my past jobs with dates and a description
  So that employers can see my professional background at a glance

  Background:
    Given I am on the "CV content" step of the builder
    And the "Professional Experience" section is visible

  Scenario: Adding the first experience entry
    Then I see fields for Job title, City, Employer, Start date, End date,
      and a rich-text Description
    And I see "Save" and "Remove" controls scoped to this entry

  Scenario: New entries default to the current month/year
    When I add a new (not-yet-saved) experience entry
    Then its Start date and End date both default to the current month and year

  Scenario: Marking a role as current/ongoing
    Given I am editing an experience entry
    When I open the End-date month dropdown
    And I select "Present"
    Then the End-date year selector is removed from the form
    And, once saved, the entry's summary shows "<start month> <start year> - Present"

  Scenario: Reducing date precision
    Given I am editing an experience entry
    When I set the Start-date month to "Don't show"
    Then, once saved, the entry's summary/CV rendering shows only the start year,
      with no month

  Scenario: Adding multiple experience entries
    Given I have already saved one experience entry
    When I click "Add another professional experience"
    Then a new, blank entry form appears below the existing (now-collapsed) entry
    And I can fill in and save it independently

  Scenario: Editing a saved entry
    Given I have a saved experience entry collapsed into its summary row
    When I click the edit (pencil) icon on that row
    Then the full form for that entry re-expands with its previously saved values

  Scenario: Deleting an entry
    Given I have a saved experience entry
    When I click the delete (✕) icon on that row
    Then that entry is permanently removed
    And it does not appear on the generated CV

  Scenario: Reordering entries manually
    Given I have two or more saved experience entries
    When I drag an entry's handle above another entry
    Then the entries' display order updates accordingly
    And this manual order is what's used when rendering the CV
      (unless "organize chronologically" is enabled — see section management)

  Scenario: Tips are available per entry
    When I click "Tips" on an experience entry
    Then I see writing guidance relevant to describing professional experience

  Scenario: Description supports rich text formatting
    When I select text in the Description field and apply Bold, Italic,
      Underline, or a list format
    Then the formatting is applied and preserved on save
```

## Nuances and edge cases to design for

- **"Present" must be modeled as a distinct end-date state, not a magic year value.** Do not represent "ongoing" as, say, `endYear: 9999` or `endYear: null` ambiguously with "not yet filled in" — an explicit `isPresent: boolean` (or equivalent tri-state: `{month, year} | 'present' | 'unset'`) avoids an entire class of rendering and sorting bugs, especially once "organize chronologically" (see `15-section-management.md`) needs to treat a "Present" entry as more recent than any dated entry.
- **Date-granularity control ("don't show month" / "year only") is per-endpoint**, not per-entry — a user can, for instance, show a precise start month but only the end year, which is realistic (people often remember exactly when they started a role but only roughly when it ended, or vice versa). Preserve this per-field granularity rather than collapsing it to one setting per entry.
- **The apparent duplication between "Não mostrar" and "Exibir apenas o ano"** needs to be resolved with direct product testing before we lock our own data model — they may in fact be identical in effect (i.e. redundant options that should be consolidated in our version) or may have a subtle difference (e.g., one omits the date from the CV render entirely including from a "duration" calculation, while the other keeps the year visible only). **Do not silently copy this ambiguity into our spec as if it were confirmed intentional design** — treat it as an open question to resolve with our own UX call, most likely by shipping a single clear "Show: Month + Year / Year only / Hidden" per-date control instead of two overlapping options.
- **The summary/collapsed view is the primary "list of experiences" UI** — users spend most of their time in this step looking at collapsed rows, not open forms. Getting the collapsed-row information density right (title + date range, one line) matters as much as the expanded form itself.

## Opportunities (where we should improve on the reference)

1. **Resolve the "don't show month" vs "show year only" ambiguity** into one unambiguous control, as noted above.
2. **Warn (not block) on overlapping or reversed date ranges** — e.g., an end date earlier than the start date, or two experience entries with heavily overlapping full-time date ranges — since this is a common, easy-to-miss data-entry mistake that undermines a CV's credibility, and the reference product does not appear to validate for it.
3. **Consider a lightweight "duration" auto-calculation display** (e.g., "3 yrs 2 mos") next to the date range in the collapsed summary row, purely as a nice-to-have — not observed in the reference product but a small addition that helps users sanity-check their own timeline while editing.
