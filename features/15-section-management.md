# Feature: Cross-Cutting Section Management (Reorder, Hide, Rename, Page Break, Auto-Sort)

## Summary

Every section on the content-builder step — built-in (Profile, Experience, Education, Interests, References, Skills) or user-added (Languages, Courses, Achievements, Publications, Custom) — shares the exact same management chrome: two reorder arrows and a settings gear in its header, and (for repeatable sections) a drag handle on each individual entry. This file documents that shared mechanism once, since every other feature file references it rather than repeating it.

## Why this feature exists

A CV builder with a dozen possible section types needs a single, learnable mental model for "how do I move/hide/rename/remove a thing," rather than each section reinventing its own controls. Consistency here is what lets a user who has never used the product before instantly understand every section after using just the first one.

## Observed behavior

### Section-level header controls (every section, always visible)
- **▲ / ▼ (up/down arrows):** move the entire section up or down in the overall CV layout, one position per click.
- **⚙ (gear icon):** opens a small settings popover/modal, identical in structure for every section type, containing:
  - **"Editar nome da secção"** ("Edit section name") — a text input pre-filled with the section's current display name (e.g. "Experiência profissional"), editable to anything. Subtext: *"Edite o nome desta secção exibida no seu CV."* This is how custom sections get their real name, but it also lets a user rename any built-in section (e.g. rename "Interesses" to something else) if they want different wording.
  - **"Ocultar secção"** ("Hide section") toggle. Subtext: *"Oculte esta secção do seu CV. Os dados nesta secção continuarão disponíveis para edição."* — hiding removes the section from the rendered/exported CV but explicitly preserves its data for later re-enabling.
  - **"Forçar quebra de página de secção"** ("Force section page break") toggle. Subtext: *"Mova esta secção para a próxima página (PDF), forçando uma quebra de página. Por exemplo, de forma a prevenir que a secção quebre numa quebra de página normal."* — lets a user push a section onto a fresh PDF page rather than letting it split awkwardly mid-section at a natural page boundary.
  - **"Organizar cronologicamente"** ("Organize chronologically") toggle, present on sections with dated entries (e.g. Experience, Education, Courses) — subtext: *"Organize todos os itens na sua secção de forma cronológica."* When enabled, entries are auto-sorted by date rather than respecting manual drag-order.

### Entry-level controls (repeatable sections only: Experience, Education, Skills, Languages, Interests, References, Courses)
- Each saved entry collapses to a compact summary row (title/name + a secondary line, varies per section type) with three icons: **✕ (delete)**, **✏️ (edit)**, **☰ (drag handle for manual reorder within the section)**.
- A completion-count badge (small numbered circle, e.g. "2") appears next to a section's icon in its header once it has one or more saved entries — a lightweight, always-visible signal of how much content exists in a collapsed section without needing to expand it.

### Save model
- Every field-editing surface (whole section for freeform types, or one entry's form for repeatable types) has its own explicit **"Gravar"** (Save) button. No autosave or debounced-save behavior was observed anywhere in the builder — a user must click Save for content to be committed and reflected in the completion badge / collapsed summary.

## Functional requirements (Gherkin)

```gherkin
Feature: Cross-cutting section management
  As a job seeker organizing my CV
  I want a single, consistent way to reorder, hide, rename, and paginate
    any section of my CV, no matter what kind of section it is
  So that I don't have to learn a different interaction model per section

  Background:
    Given I am on the "CV content" step of the builder

  Scenario: Reordering sections with arrows
    Given "Education" appears below "Experience"
    When I click the up-arrow on "Education"'s header
    Then "Education" moves above "Experience" in the layout

  Scenario: Hiding a section without losing its data
    Given the "Interests" section has one saved hobby entry
    When I open its settings and enable "Hide section"
    Then "Interests" no longer appears in the rendered/exported CV
    But my saved hobby entry is still present when I disable "Hide section" again

  Scenario: Renaming a section
    Given I open the settings for "Interesses"
    When I change its name to "O que faço no meu tempo livre"
    Then the section's header and its heading on the rendered CV both update
      to the new name

  Scenario: Forcing a page break before a section
    Given my CV content is long enough to span multiple pages
    When I enable "Force section page break" on "Achievements"
    Then "Achievements" always starts at the top of a new page in the
      exported PDF, even if there would have been room for it to start
      partway down the previous page

  Scenario: Auto-sorting entries chronologically
    Given "Experience" has two entries added in non-chronological order
    When I enable "Organize chronologically" on "Experience"
    Then the entries are re-ordered by date (most recent first, or per our
      chosen convention) regardless of the order I originally added them in
    And manual drag-reordering has no further effect while this is enabled

  Scenario: Manually reordering entries within a section
    Given "Organize chronologically" is disabled for "Skills"
    And I have three saved skill entries
    When I drag the third entry's handle above the first
    Then the entries' order updates to reflect my manual arrangement

  Scenario: Explicit save is required to persist changes
    Given I am editing an entry's fields
    When I navigate away without clicking "Save"
    Then my in-progress edits to that entry are not reflected in its
      collapsed summary or included in the rendered CV
      (see "Opportunities" below for why we intend to change this default)

  Scenario: Completion badge reflects saved entry count
    Given a repeatable section has two saved entries
    Then its header shows a badge indicating "2"
    When I add and save a third entry
    Then the badge updates to "3"
```

## Nuances and edge cases to design for — including a defect found during this walkthrough

- **"Hide section" vs. "delete section" are different, both-necessary operations.** Hiding must never discard data; deleting (available for user-added optional sections, not the fixed built-in ones) does. Keep this distinction explicit in the data model — a `hidden: boolean` flag independent of the section's existence/removal.
- **"Organize chronologically" and manual drag-order are mutually exclusive for entries within a section** — when the toggle is on, manual drag actions should be either disabled or clearly understood to have no lasting effect, to avoid a confusing "I dragged it but it snapped back" experience. Make the toggle's effect on the drag handle's availability/behavior an explicit UI state, not just a silent backend re-sort.
- **Reproduced defect — rapid/automated section-add interactions can create duplicate section cards and leak stray keystrokes into whichever field was previously focused.** (Full repro detail lives in `14-custom-sections.md`.) The root cause implicated here is the *general* section-management layer, not something specific to custom sections — any "add a section" action needs to be treated as a single atomic, debounced operation, and focus must move deterministically to the newly created element only after it has fully rendered and the underlying data store has confirmed the new section's existence. This requirement applies globally to this cross-cutting feature, not just to the custom-section flow where we happened to observe it.
- **No autosave, no "unsaved changes" warning, no toast/confirmation on successful save** were observed anywhere. This is a deliberate simplicity choice in the reference product (explicit save = explicit, predictable state), but it is also the single biggest data-loss risk in the whole builder: a user who edits a field, gets distracted, and clicks "Next step" (or closes the tab) loses that edit silently, with zero warning. See Opportunities.

## Opportunities (where we should improve on the reference)

1. **Add a lightweight, unobtrusive autosave** (debounced, e.g. 1–2 seconds after the user stops typing) with a small "Saved" / "Saving..." indicator, rather than requiring an explicit click per field/entry — or, at minimum, if we keep explicit-save as the model, **add a warn-before-navigate guard** when a form has unsaved edits and the user tries to advance to the next builder step or close/leave the page.
2. **Fix the duplicate-section-creation and keystroke-leakage defect** as a hard requirement, not a "nice to have" — this is a correctness bug, not a UX polish item.
3. **Give successful "Save" clicks a brief, visible confirmation** (e.g. a checkmark flash, a toast) — the reference product gives no positive feedback beyond the section's completion badge incrementing, which is easy to miss, especially for freeform sections that have no count to increment at all (a saved Achievements block gives the user almost no visual confirmation that anything happened).
