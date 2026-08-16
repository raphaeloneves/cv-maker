# Feature: References ("Referências")

## Summary

A repeatable section for listing professional references (a former manager or colleague who can vouch for the candidate), each with company, contact person, phone, and email. The section also has a single page-level toggle that replaces the entire detailed list with the standard "references available on request" placeholder line — a first-class alternative to actually listing anyone.

## Why this feature exists

References are one of the more sensitive CV sections: listing a real person's contact details means the candidate needs their consent, and many candidates simply don't want to publish that information on a document that circulates widely (recruiters, job boards, sometimes public portfolio sites). The conventional compromise — a boilerplate line saying references are available if asked — is extremely common on real CVs, so treating it as a genuine one-click mode rather than something the user has to type manually into a field is a meaningfully better piece of design than a bare form would be.

## Observed behavior

- Section header: **"Referências"**, speech-bubble icon.
- At the very top of the section, above any entries, a toggle switch labelled: **"Referências mediante pedido? Exiba \"Referências disponíveis, mediante pedido\" no seu CV."** ("References upon request? Show 'References available upon request' on your CV.") Default state observed: **off ("Não")**.
- Fields per entry (used when the toggle is off / entries are being listed): **Nome da Empresa** (Company name), **Pessoa de Contacto** (Contact person), **Número de Telefone** (Phone number), **Endereço de email** (Email address).
- **"+ Adicionar outra referência"** ("+ Add another reference") appends further entries.
- Same **Tips / Save / Remove** pattern per entry; saved entries collapse to a summary row showing **company name (bold)** with **contact person's name** underneath, e.g. **"Talkdesk / Ana Martins."**

## Functional requirements (Gherkin)

```gherkin
Feature: References
  As a job seeker
  I want to either list specific professional references or
    simply state that references are available on request
  So that I can share what I'm comfortable sharing while still meeting the
    common expectation that a CV addresses references in some way

  Background:
    Given I am on the "CV content" step of the builder
    And the "References" section is visible

  Scenario: Default state lists individual references
    Then the "References available upon request" toggle is off
    And I can add individual reference entries with company, contact person,
      phone, and email

  Scenario: Adding a reference
    When I fill in company name, contact person, phone, and email
    And I save the entry
    Then it collapses to a summary row showing the company and contact person

  Scenario: Switching to "available upon request" mode
    Given I have zero or more individual reference entries already saved
    When I turn on "References available upon request"
    Then the CV preview shows the placeholder line
      "References available upon request" instead of any individual reference details
    And this is true even if I have individually-listed references already saved
      (the toggle takes precedence for what's rendered)

  Scenario: Switching back to listing references
    Given "References available upon request" is on
    When I turn the toggle off
    Then any previously saved individual reference entries are shown again,
      unmodified — turning the toggle on and off does not delete entered data

  Scenario: Adding multiple references
    Given I have saved one reference entry
    When I click "Add another reference"
    Then a new blank entry form appears, independent of the first

  Scenario: The section is entirely optional
    Given I have neither added any reference entries nor enabled the toggle
    When I advance to the next builder step
    Then I am not blocked from advancing
```

## Nuances and edge cases to design for

- **The toggle and the entry list are independent state, not mutually exclusive data.** The toggle controls *what's rendered on the CV*, not what's *stored* — a user can have real reference entries saved and still choose, per-application, to show the generic placeholder instead (e.g., because a specific job application doesn't warrant sharing contact details, but they don't want to delete the data they've already entered for other uses of the same CV). This is the single most important behavior to get right in this feature: toggling must never destroy the underlying entries.
- **Phone and email fields here are plain text**, similar to the personal-info step's own contact fields — no distinct validation pattern was observed to differ from standard phone/email input handling elsewhere in the product.

## Opportunities (where we should improve on the reference)

1. **Surface a brief consent reminder** near the reference entry form (e.g., "Make sure you have this person's permission before listing their contact details") — not present in the reference product, but a low-cost, high-value addition given the sensitivity of publishing a third party's personal contact information.
2. **Consider letting the "available upon request" toggle be a smart default** that automatically flips on once the user starts filling in the section without completing an entry, or offering it more prominently before the entry form rather than requiring the user to notice the toggle above the fields — not a defect in the reference product, just a possible discoverability improvement worth user-testing.
