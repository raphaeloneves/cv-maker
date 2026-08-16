# Feature: Education & Qualifications

## Summary

A repeatable section, structurally near-identical to Work Experience (`05-work-experience.md`), for listing degrees and formal qualifications: what was studied, where, when, and any notable detail (grade, thesis topic, honors).

## Why this feature exists

Education is the second pillar employers check after work history, and for early-career candidates with little or no work experience it's often the *primary* pillar. Reusing the same interaction pattern as Work Experience (repeatable entries, granular dates, rich-text description) is deliberate and valuable: once a user learns how to add/edit/reorder one section, they already know how to operate this one — a consistency principle we should preserve.

## Observed behavior

- Section header: **"Formação e Qualificações"**, graduation-cap icon.
- Fields per entry: **Grau** (Degree — e.g. "p. ex. Licenciatura" placeholder), **Cidade/Localidade** (City), **Escola** (School/institution — placeholder "p. ex. Universidade de Lisboa"), **Data de Início** / **Data de Término** (identical Month/Year select pattern as Experience, including the "Presente" option on the end date and the "Don't show month" / "year only" options), **Descrição** (rich text).
- **"+ Adicionar outra formação"** ("+ Add another qualification") appends further entries.
- Same per-entry **Tips / Remove / Save** controls, same collapsed summary-row-with-edit/delete/drag-handle pattern once saved, e.g. **"Licenciatura em Engenharia Informática — setembro 2010 - julho 2014."**

## Functional requirements (Gherkin)

```gherkin
Feature: Education and qualifications
  As a job seeker
  I want to list my degrees and qualifications with dates and details
  So that employers can verify my educational background

  Background:
    Given I am on the "CV content" step of the builder
    And the "Education and Qualifications" section is visible

  Scenario: Adding an education entry
    Then I see fields for Degree, City, School, Start date, End date,
      and a rich-text Description

  Scenario: Adding multiple education entries
    Given I have saved one education entry
    When I click "Add another qualification"
    Then a new blank entry form appears, independent of the first

  Scenario: Date handling matches Work Experience
    Then Start date and End date behave identically to the Work Experience
      section's date controls, including "Present," "don't show month," and
      "year only" on the end date's month selector

  Scenario: Editing, deleting, and reordering
    Given I have two or more saved education entries
    Then I can edit, delete, and drag-reorder them exactly as in Work Experience

  Scenario: Description supports free-text detail
    When I write in the Description field
    Then I can include details such as thesis topic, honors, or final grade,
      formatted with the same Bold/Italic/Underline/list toolbar as elsewhere
```

## Nuances and edge cases to design for

- **This section should share its date-handling and repeatable-entry implementation with Work Experience** rather than being a parallel, independently-built copy — both in the reference product's evident design and in our own codebase, this should be one configurable "repeatable timeline entry" component (fields + date-range widget + rich-text description + tips/save/remove) instantiated twice with different field sets (Cargo/Empregador vs. Grau/Escola), not duplicated logic. This matters for maintainability and for guaranteeing the two sections never silently drift in behavior (e.g., one getting a bug fix for the "Present" toggle that the other doesn't).
- **No structured "grade/GPA" field exists** — grade information (e.g., "Média final de 16 valores" / final grade of 16 out of 20) is left to free text inside the Description, not a first-class field. This is a reasonable choice given how much grading scales vary by country (GPA, 20-point, percentage, honors classifications), but it does mean a template can't visually highlight "Grade: X" distinctly unless we later decide to add a structured optional field for it.

## Opportunities (where we should improve on the reference)

1. Consider whether a small set of **common "Degree type" suggestions** (e.g. autocomplete: Bachelor's / Master's / PhD / Associate / Vocational certificate) would speed up data entry over a fully blank text field, while still allowing free text for degree types that don't fit a preset list — not present in the reference product.
2. As with Work Experience, **validate for reversed or overlapping date ranges** rather than accepting anything silently.
