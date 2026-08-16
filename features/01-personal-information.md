# Feature: Personal Information Capture

## Summary

This is the first screen of the CV builder and the first thing every user does. It collects the identity, contact, and biographical data that appears in the header/sidebar of almost every CV template: name, how to reach the person, where they live, and (optionally) a set of biographical extras that some employers or countries expect (date of birth, nationality, driving licence, etc.).

## Why this feature exists

A CV is useless to an employer if they can't identify or contact the candidate. But different markets and industries expect wildly different amounts of personal detail on a CV — some European employers still expect date of birth and a photo; many US/UK employers actively discourage both for anti-discrimination reasons. The feature has to satisfy both expectations at once: **capture the minimum viable contact data by default, and make everything else optional and easy to add without cluttering the initial view.**

## The nuance: progressive disclosure

The screen visibly shows only 6 fields on load: photo placeholder, first name, last name, email, phone, address, postal code, city. A single toggle button, **"+ Informação adicional"** ("+ Additional information"), reveals 10 more fields in place (no navigation, no modal) when clicked, and the button becomes **"− Informação adicional"** to allow collapsing again. This is the single most important UX decision on this screen: it keeps the perceived form length short for users who just want a fast contact block, while making the fuller biographical form available in one click for users (or markets) that need it. Our implementation must preserve this pattern exactly — do not flatten all fields into one always-visible list.

## Source reference (PT-PT, needs PT-BR transcreation)

| Field | Source label (PT-PT) | Required? | Input type | Notes |
|---|---|---|---|---|
| Photo | "Adicionar foto" | No | Upload + crop | See `02-profile-photo-upload.md` |
| First name | "Primeiro nome*" | **Yes** | Text | |
| Last name | "Apelido*" | **Yes** | Text | PT-BR: "Sobrenome" |
| Email | "Endereço de email*" | **Yes** | Text (email) | |
| Phone number | "Número de telefone" | No | Text | |
| Address | "Morada*" | **Yes** | Text | PT-BR: "Endereço" |
| Postal code | "Código postal" | No | Text | |
| City/locality | "Cidade/Localidade" | No | Text | Placeholder example: "p. ex. Lisboa" |
| — toggle — | "+ / − Informação adicional" | — | Disclosure control | |
| Date of birth | "Data de nascimento" | No | 3 selects: Dia / Mês / Ano | See constraints below |
| Place of birth | "Local de nascimento" | No | Text | |
| Driving licence | "Carta de condução" | No | Text (free text, e.g. "Categoria B") | PT-BR: "Carteira de motorista" |
| Gender | "Sexo" | No | Select | Only two options — see gap below |
| Nationality | "Nacionalidade" | No | Text | |
| Marital status | "Estado civil" | No | Text (free text, not a select) | |
| LinkedIn | "LinkedIn" | No | Text (URL/handle) | |
| Website | "Website" | No | Text (URL) | |

A page-level control, **"Idioma do CV"** ("CV language"), sits in the top-right of the card, independent of all the above fields — this sets the *content* language of the generated CV (section headings etc.), not the site's UI language. It is documented separately in `03-internationalization.md` because it applies to the whole builder, not just this step.

## Functional requirements (Gherkin)

```gherkin
Feature: Personal information capture
  As a job seeker starting a new CV
  I want to enter my identity and contact details
  So that an employer can identify me and get in touch

  Background:
    Given I am on the "Personal Information" step of the CV builder

  Scenario: Minimal required fields are visible by default
    Then I see input fields for first name, last name, email, phone number,
      address, postal code, and city
    And I do NOT see fields for date of birth, place of birth, driving licence,
      gender, nationality, marital status, LinkedIn, or website
    And I see a control labelled "Additional information" that is collapsed

  Scenario: Required fields are marked and enforced
    Given first name, last name, email, and address are marked as required
    When I try to advance to the next step with any required field empty
    Then I am blocked from advancing
    And the empty required field(s) are visually indicated

  Scenario: Optional fields do not block progress
    Given I have filled in only the required fields
    When I click "Next step"
    Then I am allowed to advance

  Scenario: Expanding additional information
    When I click "Additional information"
    Then the section expands in place, without navigating away or opening a modal
    And I now see fields for date of birth, place of birth, driving licence,
      gender, nationality, marital status, LinkedIn, and website
    And the control's label/icon changes to indicate it can now be collapsed

  Scenario: Collapsing additional information preserves entered data
    Given I have expanded "Additional information" and entered a nationality
    When I collapse "Additional information"
    And I expand it again
    Then the nationality value I entered is still present

  Scenario Outline: Date of birth is composed of three independent selectors
    Given "Additional information" is expanded
    When I select "<day>" for day, "<month>" for month, and "<year>" for year
    Then the date of birth is recorded as <day> <month> <year>

    Examples:
      | day | month | year |
      | 15  | March | 1990 |

  Scenario: Gender is a closed list of two options
    Given "Additional information" is expanded
    When I open the "Gender" dropdown
    Then I see exactly two options: "Male" and "Female"

  Scenario: Email format is validated
    When I enter "not-an-email" into the email field
    And I move focus away from the field or attempt to advance
    Then I see a validation message indicating the email format is invalid

  Scenario: Free-text fields accept international characters
    When I enter "São Paulo, Brasil" into "Place of birth"
    Then the value is accepted and stored without alteration, including diacritics
```

## Nuances and edge cases to design for

- **The additional-information fields are not a separate step** — they persist as part of the same single-page form and are submitted together with the base fields. Do not model them as a distinct wizard step; model them as a disclosure state (`isAdditionalInfoExpanded: boolean`) on the same form.
- **Address (`Morada`) is required, but postal code and city are not.** This looks inconsistent at first glance, but it reflects that "Morada" alone (e.g., just a city/country in some conventions) is often what appears on the printed CV, while postal code and precise city are used more for form-filling/ATS metadata than for the visible document. Preserve this exact required/optional split rather than "fixing" it to make all address fields required together.
- **Driving licence and marital status are free text, not enumerations**, unlike Gender. This is a deliberate (if slightly inconsistent) choice — driving licence categories differ by country (Categoria B, Class C, etc.) and marital status terminology/labelling is culturally sensitive enough that a fixed list would be presumptuous. Keep both as free text in our implementation too.
- **LinkedIn and Website are plain text fields, not validated URLs** in the reference product (no visible `https://` enforcement or format check was observed). Consider whether to add lightweight URL validation without breaking the common pattern of users pasting a bare handle like `linkedin.com/in/name`.

## Opportunities (where we should improve on the reference)

1. **Add a "Prefer not to say" / non-binary option to Gender**, or better, make it fully optional free text or a tri/four-state select (Male / Female / Non-binary / Prefer not to say). The current hard binary is a real accessibility and internationalization gap — flagged in the overview doc as a must-fix, not a nice-to-have, especially since we're building this to be international-market-ready from day one.
2. **Revisit the date-of-birth year range.** The reference product's year selector stops at 2015, which would silently prevent a legitimate teenage user from entering their real birth year in the near future. Our year range should be computed dynamically (e.g., "current year" down to "120 years ago") rather than hard-coded.
3. **Consider surfacing a short explainer near "Additional information"** (e.g., a one-line hint: "Some of these fields are expected in certain countries and industries, and discouraged in others — only add what's relevant to where you're applying") since we're explicitly targeting an audience less familiar with the European CV convention of listing DOB/photo/marital status than PT-PT users might be.
