# Feature: Professional Summary ("Perfil")

## Summary

The first, always-present section of Step 2 (the content builder). A single rich-text field, labelled "Descrição" under a "Perfil" section header, where the user writes a short paragraph about themselves that sits at the very top of the finished CV, above Experience and Education.

## Why this feature exists

Recruiters skim. A well-written 3–4 sentence summary at the top of a CV is often the only part that gets read in the first pass, so it disproportionately affects whether the rest of the document gets read at all. Most users, left to a blank textbox, either skip it or write something generic and useless ("Hardworking team player seeking new opportunities"). The feature's job is not just to collect text — it's to coach the user into writing a summary that actually works.

## Observed behavior

- Section header: **"Perfil"**, with a person-icon, and (like every section) up/down reorder arrows and a gear/settings icon in the top-right of its card.
- Field label: **"Descrição"**.
- The text field is a **rich text editor** with a formatting toolbar offering: **Bold (B)**, *Italic (I)*, <u>Underline (U)</u>, ordered list, and unordered list. No headings, links, or other formatting are exposed — deliberately minimal, appropriate for a short paragraph rather than a structured document.
- A **"Dicas"** ("Tips") button opens a small popover/tooltip with numbered writing guidance:
  1. *"O seu perfil é sempre colocado no topo do seu CV."* ("Your profile is always placed at the top of your CV.")
  2. *"Descreva-se de forma curta e concisa, tendo em conta a vaga e o cargo em questão. Não utilize frases demasiado curtas, mas seja tão conciso quanto possível."* ("Describe yourself briefly and concisely, considering the job posting and role in question. Don't use overly short sentences, but be as concise as possible.")
  3. *"Crie um bom perfil ao mencionar pelo menos cada um dos seguintes atributos: conquistas, qualidades, ambições, objetivos e o que procura."* ("Build a good profile by mentioning at least each of the following: achievements, qualities, ambitions, goals, and what you're looking for.")
- An explicit **"Gravar"** ("Save") button commits the field. There is no auto-save observed — content is only persisted (and reflected in a completion badge on the section header, e.g. a small "1" indicator) once "Save" is clicked.
- Unlike every other section on this step, Perfil is **not repeatable** — there is exactly one summary, no "add another" control, and no delete control (it's a fixed, always-present section, though it can still be hidden via the shared section-settings gear icon — see `15-section-management.md`).

## Functional requirements (Gherkin)

```gherkin
Feature: Professional summary
  As a job seeker
  I want to write a short introductory paragraph about myself
  So that recruiters get a strong first impression at the top of my CV

  Background:
    Given I am on the "CV content" step of the builder
    And the "Profile" section is visible at the top of the page

  Scenario: Profile is present by default and not removable
    Then I see a "Profile" section with a "Description" rich-text field
    And there is no control to delete the Profile section entirely
      (only the shared hide/show control described in section management)

  Scenario: Formatting the summary
    When I select some text I have typed in the Description field
    And I click "Bold"
    Then the selected text is rendered bold
    And the same applies for Italic, Underline, ordered list, and unordered list

  Scenario: Viewing writing tips
    When I click "Tips"
    Then I see guidance covering:
      | tip |
      | The profile always appears at the top of the CV |
      | Keep it short and concise, tailored to the role being applied for |
      | Mention achievements, qualities, ambitions, goals, and what you're looking for |

  Scenario: Saving the summary
    Given I have typed a paragraph into the Description field
    When I click "Save"
    Then the section header shows a completion indicator (e.g. a count badge)
    And my text persists if I navigate to another section and back

  Scenario: Leaving the summary empty
    Given the Description field is empty
    When I advance to the next builder step without clicking "Save"
    Then I am not blocked from advancing
      (this section is optional despite being prominently placed first)
```

## Nuances and edge cases to design for

- **Explicit save, not autosave, and no "unsaved changes" warning was observed.** This is a broader pattern across the whole content-builder step (see `15-section-management.md` and `16-builder-navigation-progress.md` for the cross-cutting requirement and our recommended improvement), but it's worth calling out here specifically because the Profile section is the very first thing a new user interacts with on this page — if they type a paragraph, get distracted, and click "Next step" without ever pressing "Save," their work silently vanishes. Whatever we decide for the save model globally, this section is the highest-stakes place to get it right, since it's most users' first content-entry experience in the product.
- **The rich-text toolbar is intentionally minimal** (B/I/U + lists only, no headings/links/font-size). Resist the temptation to over-build this into a full WYSIWYG editor; a CV summary is a short paragraph, and excess formatting power both looks unprofessional if misused and complicates PDF export.
- **Tips content is static and section-specific**, not personalized/AI-generated. Treat the tips as versioned copy content (translatable per `03-internationalization.md`'s builder-UI-locale axis, not the CV-content-language axis, since tips are builder chrome, not CV content) rather than a dynamic feature.
