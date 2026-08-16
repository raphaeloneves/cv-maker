# Feature: Hobbies & Interests ("Interesses")

## Summary

The simplest repeatable section in the product: each entry is a single free-text field naming one hobby or interest, with no supporting metadata (no description, no level, no date).

## Why this feature exists

Hobbies are a low-stakes, optional CV section that some employers value as a signal of personality/culture fit and others ignore entirely — hence its position as fully optional and structurally minimal. Its main job is simply to *not get in the way*: a user who wants to list "Trail running, chess, photography" should be able to do that in seconds, not fight a form designed for something more complex.

## Observed behavior

- Section header: **"Interesses"**, palette icon.
- A single field per entry, labelled **"Hobby"** (note: this label is in English even in the PT-PT reference product — likely an oversight/inconsistency worth fixing in our own localized copy rather than replicating).
- **"+ Adicionar outro hobby"** ("+ Add another hobby") appends further single-field entries — each hobby is its own repeatable entry/row, **not** a single comma-separated text field for the whole list.
- Same **Save / Remove** pattern; saved entries collapse to a summary row showing just the hobby name (e.g. **"Corrida de trail"**), with edit/delete/drag-handle icons.
- No "Tips" button observed on this section (consistent with Skills — the simplest sections skip writing guidance).

## Functional requirements (Gherkin)

```gherkin
Feature: Hobbies and interests
  As a job seeker
  I want to optionally list a few personal hobbies or interests
  So that I can add a personality/culture-fit signal to my CV if I choose to

  Background:
    Given I am on the "CV content" step of the builder
    And the "Hobbies and Interests" section is visible

  Scenario: Adding a single hobby
    When I type a hobby name into the field
    And I save the entry
    Then it collapses to a summary row showing just that hobby name

  Scenario: Adding multiple hobbies
    Given I have saved one hobby entry
    When I click "Add another hobby"
    Then a new blank single-field entry appears, independent of the first

  Scenario: Each hobby is an independent, deletable entry
    Given I have three saved hobby entries
    When I delete the second one
    Then only that one is removed; the other two remain unaffected

  Scenario: The section is entirely optional
    Given I have added no hobby entries
    When I advance to the next builder step
    Then I am not blocked from advancing
```

## Nuances and edge cases to design for

- **One hobby per entry, not a free-text list.** This is a deliberate structural choice worth preserving: modeling hobbies as discrete repeatable entries (rather than one big text field) makes each hobby independently reorderable/deletable and gives templates a consistent way to render them (e.g., as a comma-separated inline list, or as pill/tag chips) regardless of how many the user has. Don't simplify this to a single textarea — that would remove per-item editing and reordering.
- **The "Hobby" field label appears to be un-translated English left in an otherwise PT-PT interface** — a small but real localization bug in the reference product. Every field label in our PT-BR version must be reviewed for this kind of leak, not just spot-checked on the obviously "important" fields.

## Opportunities (where we should improve on the reference)

1. **Translate every field label consistently** — don't let an English placeholder slip through into a localized build, as happened here.
2. **Consider a lightweight tag-style input** (type a hobby, press Enter/comma to commit it as a chip, keep typing for the next one) as an alternative interaction for this specific section, given how low-friction hobby entry should be compared to, say, Work Experience — this is a UX enhancement opportunity, not a correction of a defect, since the reference product's repeatable-row pattern works fine, just with more clicks than strictly necessary for such simple data.
