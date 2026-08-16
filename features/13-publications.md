# Feature: Publications ("Publicações")

## Summary

An optional section (added via the "+ extra section" mechanism), mechanically identical to Achievements (`12-achievements.md`): a single free-form rich-text Description block, no repeatable structured entries.

## Why this feature exists

Aimed at candidates for whom published work is a meaningful credential — academics, researchers, technical writers, journalists, engineers who've written papers or articles — this section gives them a dedicated, correctly-labelled place to list publications (title, venue, year, etc., all as free text within one block) without repurposing the Achievements or a Custom section for it.

## Observed behavior

- Added via "+ Adicione uma secção extra" as **"Publicações."**
- Identical structure to Achievements: one **"Descrição"** rich-text field, one **"Gravar"** button, no repeatable entries, no Tips button.
- A user is expected to format multiple publications themselves within the single block — e.g. one per line or as a bulleted list using the rich-text list tool — since there's no structured per-publication entry (title/venue/year as separate fields).

## Functional requirements (Gherkin)

```gherkin
Feature: Publications
  As a job seeker with published written work
  I want a dedicated, clearly labelled place to list my publications
  So that this credential is presented appropriately rather than folded into
    a generic achievements or custom section

  Background:
    Given I have added the "Publications" section to my CV via the
      "add an extra section" control

  Scenario: The section is a single free-text block
    Then I see one "Description" rich-text field and one "Save" control
    And there is no "add another entry" control — this is not a repeatable section

  Scenario: Listing multiple publications
    When I use the ordered- or unordered-list formatting tool while writing
    Then I can present multiple publications as a clean list within the
      single Description field

  Scenario: Saving
    When I write content into Description and click "Save"
    Then the section shows a completion indicator
    And the content persists across navigation within the builder
```

## Nuances and edge cases to design for

- Shares the same "freeform section" primitive discussed in `12-achievements.md` — implement once, instantiate per preset. See that file for the shared architectural note.
- Because there's no structured per-publication data (no separate title/venue/year fields), a user citing several publications has to manually format them consistently themselves — the product provides no citation-style help. This is consistent with the section being a lightweight, low-frequency-use feature rather than a bibliography manager, and is an acceptable, deliberate scope boundary rather than a defect — see the Opportunities section for a possible middle-ground improvement.

## Opportunities (where we should improve on the reference)

1. **Consider whether Publications deserves to be a genuinely repeatable structured section instead of a freeform block** (title / venue-or-publisher / year / optional link, one entry per publication) — for the specific audience this section targets (academics, researchers), a structured, consistently-formatted list is arguably more valuable than for Achievements, where unstructured prose fits the content better. This is a real product decision to make deliberately rather than defaulting to copying the reference product's freeform-for-everything approach.
