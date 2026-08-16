# Feature: Adding Extra Sections & Fully Custom Sections

## Summary

Below the fixed, always-present sections (Profile, Experience, Education, Interests, References, Skills), a dropdown control labelled **"+ Adicione uma secção extra"** ("+ Add an extra section") lets the user append additional, optional section *types* to their CV: Languages, Courses, Achievements, Publications, or — the most open-ended option — **"Crie uma secção personalizada"** ("Create a custom section"), which lets the user invent an entirely new, freely-named section for content that fits none of the presets.

## Why this feature exists

No fixed set of built-in sections can anticipate every kind of content a candidate might want on their CV (volunteer work, patents, military service, portfolio links, open-source contributions, professional memberships...). Rather than an ever-growing list of narrow presets, the product solves this with two complementary mechanisms: a curated set of the *most common* additional section types (so most users find what they need without inventing anything), plus one fully generic escape hatch (a custom-named freeform section) for everything else.

## Observed behavior

- The **"+ Adicione uma secção extra"** control is a `<select>` positioned after the last fixed section, always visible.
- Choosing a preset option **immediately** creates and inserts that section (no separate "confirm/add" click needed) — the new section appears as its own card, already expanded and ready for input, positioned after the previously-last section.
- Observed preset options and their apparent internal type values:

  | Label (PT-PT) | Internal value | Structure |
  |---|---|---|
  | Idiomas | `language` | Repeatable entries (see `08-languages.md`) |
  | Cursos | `course` | Repeatable entries (see `11-courses-certifications.md`) |
  | Conquistas | `availability` | Single freeform block (see `12-achievements.md`) |
  | Publicações | `variousInformation` | Single freeform block (see `13-publications.md`) |
  | Crie uma secção personalizada | `single_textarea` | Single freeform block, user-named |

- Choosing **"Crie uma secção personalizada"** creates a new section titled, by default, **"Secção personalizada"** — a single freeform block identical in structure to Achievements/Publications, except the section's *name itself* is meant to be edited by the user (via the shared rename control in section settings — see `15-section-management.md`) to whatever they need (observed example used in this walkthrough: renaming it to **"Projetos Open Source"**).
- After adding any extra section, the **same "+ Adicione uma secção extra" control reappears** below the newly added section(s), so multiple extra sections can be stacked — e.g. a user can add both Languages *and* a custom "Open Source Projects" section, in any order.

## Functional requirements (Gherkin)

```gherkin
Feature: Adding extra sections to the CV
  As a job seeker
  I want to add optional additional sections beyond the default set
  So that I can include content types the default sections don't cover,
    and invent my own section for anything that fits none of them

  Background:
    Given I am on the "CV content" step of the builder

  Scenario: The extra-section control is always available
    Then I see a "+ Add an extra section" control below my current sections

  Scenario: Adding a preset extra section
    When I choose "Languages" from "+ Add an extra section"
    Then a new "Languages" section is immediately created and appears,
      expanded and ready for input, after my other sections
    And "+ Add an extra section" remains available below it, for adding further sections

  Scenario: Adding multiple different extra sections
    Given I have already added a "Languages" section
    When I choose "Courses" from "+ Add an extra section"
    Then a "Courses" section is added in addition to (not replacing) "Languages"

  Scenario: Creating a fully custom section
    When I choose "Create a custom section" from "+ Add an extra section"
    Then a new section titled "Custom section" is created
    And it contains a single rich-text "Description" field, like Achievements/Publications
    And I can rename it to any title I choose via the section's settings

  Scenario: Renaming a custom section
    Given I have created a custom section
    When I open its settings and change its name to "Open Source Projects"
    Then the section's header updates to "Open Source Projects"
    And this custom name is what appears on the rendered CV

  Scenario: Extra sections can be removed entirely
    Given I have added a "Publications" section
    When I remove it (via its section-level remove control)
    Then it disappears from the builder and from the rendered CV
    And "+ Add an extra section" again offers "Publications" as an option to re-add
```

## Nuances and edge cases to design for — including a defect found during this walkthrough

- **Adding a section must be a single, idempotent action per user intent.** During this walkthrough, using a fast/automated sequence of "select the option, then immediately press Enter" to add a section twice reproduced a real defect: **duplicate empty section cards were created from what the user experienced as one action**, and in one case, keystrokes intended for the *next* field leaked into the *previous*, still-focused rich-text field before the new section had fully mounted (e.g. the literal text "ção personalizada" — a fragment of the just-typed dropdown search text — ended up appended inside an unrelated, already-saved Achievements block). This points to the dropdown's "select" and "commit/create" logic not being properly synchronous/debounced with focus management. **Our implementation must guarantee**: (a) selecting an option creates exactly one section, even under rapid repeated input; (b) creating a new section always moves focus deliberately to the new section's first field, never leaving stray input events to land in whatever field was previously focused; (c) the newly created section renders fully (including its final saved/collapsed state read back from the data layer) before any further user input is accepted into it.
- **The internal type names (`availability` for Achievements, `variousInformation` for Publications) not matching their user-facing labels** is a sign these were repurposed/renamed generic primitives late in that product's life. Worth avoiding in our own codebase — name internal types to match their current purpose, or use a clearly-generic name (e.g. `freeform_section`) rather than an artifact of an earlier, different label.
- **A custom section's default name ("Secção personalizada" / "Custom section") should probably prompt the rename UI to open immediately** rather than requiring the user to separately discover the settings-gear rename control — not confirmed as the reference product's behavior (it was not observed opening automatically), but a strong candidate improvement, since a section named literally "Custom section" left un-renamed would look unfinished/broken on a real CV.

## Opportunities (where we should improve on the reference)

1. **Fix the duplicate-section/keystroke-leakage defect** described above — treat this as a priority correctness bug in our own equivalent feature, not just an artifact of our testing method, since any user who double-clicks, double-taps on mobile, or has a slightly laggy connection could plausibly trigger the same class of bug.
2. **Auto-open the rename field immediately after creating a custom section**, rather than requiring users to find the gear icon separately.
3. **Consider expanding the preset list over time based on real usage data** (e.g., "Volunteer Work," "Certifications" as distinct from generic "Courses," "Projects," "Awards") while keeping the fully-custom escape hatch for the long tail — the reference product's five presets are a reasonable starting set but not necessarily final.
