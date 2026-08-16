# Feature: Languages ("Idiomas")

## Summary

An optional, repeatable section (added via the "+ extra section" mechanism — see `14-custom-sections.md` for how that mechanism works generally) for listing spoken/written languages the candidate knows, each paired with a proficiency level. Its proficiency dropdown is the most interesting control on the whole site: it offers **two different rating frameworks in a single list.**

## Why this feature exists

Language skills are frequently decisive for international or multilingual roles, and — unlike the generic Skills section — language proficiency has genuine, widely recognized standardized frameworks (the CEFR A1–C2 scale used across Europe and increasingly globally) alongside plain-language self-description ("native speaker," "working knowledge"). Different employers and different countries expect different framing; giving users both in one control, rather than forcing a choice of framework for the whole product, is the single most sophisticated design decision found anywhere in this walkthrough.

## Observed behavior

- Added via the "+ Adicione uma secção extra" dropdown as **"Idiomas."**
- Fields per entry: **Idioma** (Language — free text, placeholder "p. ex. Espanhol") and **Nível** (Level — a `<select>`).
- The **Level dropdown contains eleven options in a single flat list**, mixing two distinct scales with no visual grouping/separator observed between them:

  **Descriptive scale** (same style of scale as the general Skills section, sharing underlying values 100/75/50/25/20):
  | Label (PT-PT) | Value |
  |---|---|
  | Falante nativo | 100 |
  | Altamente proficiente em oração e escrita | 75 |
  | Conhecimento avançado | 50 |
  | Bons conhecimentos de trabalho | 25 |
  | Conhecimentos de trabalho | 20 |

  **CEFR scale** (values encoded distinctly and clearly out of numeric sequence with the descriptive scale, e.g. 120–200, presumably so the two scales never collide if compared numerically):
  | Label | Value |
  |---|---|
  | A1 | 120 |
  | A2 | 130 |
  | B1 | 140 |
  | B2 | 160 |
  | C1 | 180 |
  | C2 | 200 |

  ⚠️ **Confirmed copy bug**: the label *"Altamente proficiente em oração e escrita"* almost certainly should read *"...em oral e escrita"* ("...in spoken and written [language]") — "oração" means "prayer" or "sentence/clause" in Portuguese, not "oral communication." This is a real, shipped typo in the reference product and must not be carried into our PT-BR copy.
- Same repeatable-entry pattern as every other section: **"+ Adicionar outro idioma"** to add more, Save/Remove per entry, collapsed summary row (e.g. **"Inglês — C1"**, **"Espanhol — B2"**), drag-to-reorder.

## Functional requirements (Gherkin)

```gherkin
Feature: Languages with dual proficiency scale
  As a job seeker who speaks more than one language
  I want to list each language I know with a proficiency level
  And choose whichever proficiency framework fits my situation
  So that employers understand my actual language ability regardless of
    which convention they're used to (plain description or CEFR)

  Background:
    Given I have added the "Languages" section to my CV
      via the "add an extra section" control

  Scenario: Adding a language
    When I type a language name and choose a proficiency level
    And I save the entry
    Then the entry collapses to a summary row showing the language and its level

  Scenario: Both proficiency frameworks are available in one control
    When I open the "Level" dropdown for a language entry
    Then I see both descriptive levels (e.g. "Native speaker," "Working knowledge")
      and CEFR levels (A1, A2, B1, B2, C1, C2) available to choose from

  Scenario: Adding multiple languages
    Given I have saved one language entry
    When I click "Add another language"
    Then a new blank entry appears, independent of the first

  Scenario: Editing, deleting, and reordering languages
    Given I have two or more saved language entries
    Then I can edit, delete, and drag-reorder them
      exactly as in other repeatable sections
```

## Nuances and edge cases to design for

- **Two scales sharing one flat dropdown works, but only barely** — with no visual separator or grouping in the reference product, a user has to read every option to notice two different frameworks are mixed together. Our implementation should preserve the *capability* (both frameworks available) but improve the *presentation* — e.g., an `<optgroup>`-style visual grouping ("Descriptive" / "CEFR") so the choice is legible at a glance rather than discovered by accident. This is a genuine improvement opportunity, not just a cosmetic nice-to-have — the underlying idea (two frameworks, one field) is worth keeping; the flat unlabeled list is worth fixing.
- **The two scales' underlying numeric values are deliberately non-overlapping ranges** (20–100 vs. 120–200) in the reference product, which suggests the two scales are meant to be comparable/orderable on one continuum for sorting/rendering purposes (e.g., a meter bar), even though they represent different frameworks. If we build a similar dual-scale mechanism, we should make this ordering relationship an explicit, tested part of the data model rather than an implicit convention.

## Opportunities (where we should improve on the reference)

1. **Fix the "oração" → "oral" typo** in the descriptive scale's second-highest level when writing our own PT-BR copy — do not copy it forward.
2. **Visually separate the two proficiency frameworks** in the dropdown (grouped options or a framework-selector-then-level two-step control) so users notice and intentionally choose between them, rather than encountering both scales unlabeled in one list.
3. **Consider a short inline hint** near the Level field explaining what CEFR is, for users unfamiliar with the standard (a one-line "CEFR is the standard European framework for language proficiency — pick this if you're unsure which scale to use for a specific job market").
