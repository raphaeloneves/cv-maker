# Feature: Internationalization — CV Content Language vs. Site UI Language

## Summary

The Personal Information step has a small dropdown in its top-right corner labelled **"Idioma do CV"** ("CV language") with observed options: **Português, Espanhol, Inglês, Italiano, Francês.** This single control is easy to mistake for a site-language switcher, but it is not — it controls the *language of the generated CV's structural text* (section headings like "Experience," "Education," etc., and any templated boilerplate the product injects), independent of whatever language the builder's own interface is displayed in.

## Why this feature exists

A huge fraction of CV Maker's real usage is people applying to jobs in a language that isn't their native one — a Portuguese speaker applying to a role in an English- or Spanish-speaking company, for instance. Forcing the CV's own language to match the site's UI language would be actively wrong for that very common case. Decoupling the two is the correct design, and it's the one piece of internationalization the reference product visibly gets right — everything else about i18n on this site is inferred/pending confirmation (see "Open questions" below).

## What this control does and does not affect

- **Does affect:** the wording of auto-generated section headings and any fixed template copy that appears *on the exported/previewed CV itself* (e.g., "Experiência Profissional" becomes "Professional Experience" if English is selected).
- **Does not affect:** the language of the *user's own typed content* — a user's job description they typed in Portuguese stays in Portuguese regardless of this setting; the product is not translating user content, only its own template labels.
- **Does not (necessarily) affect:** the builder's own UI chrome (buttons like "Próximo passo," field labels like "Primeiro nome") — that is a separate concern, the site's own UI locale, which is still being confirmed for this product (see Open questions).

## Functional requirements (Gherkin)

```gherkin
Feature: CV content language selection
  As a user building a CV for a job market in a specific language
  I want to choose the language of my CV's section headings and template text
  Independently of the language the builder itself is displayed in
  So that I can produce a CV in the target market's language even if I'm using
    the tool in my own native language

  Background:
    Given I am on the "Personal Information" step of the CV builder

  Scenario: Default CV language
    Then the "CV language" selector shows a sensible default
      (e.g. matching the builder's current UI locale, or the user's browser locale)

  Scenario: Available CV languages
    When I open the "CV language" dropdown
    Then I see at least: Portuguese, Spanish, English, Italian, French

  Scenario: Changing CV language updates section headings
    Given my CV currently has a "Professional Experience" section (built in English)
    When I change "CV language" to Portuguese
    Then that section's heading updates to its Portuguese equivalent
      ("Experiência Profissional") in the live preview
    And the content I typed inside that section (e.g. a job description) is unchanged

  Scenario: CV language selection persists across the builder
    Given I set "CV language" to Spanish on the Personal Information step
    When I advance to the next step of the builder
    Then the CV preview continues to render its structural text in Spanish

  Scenario: CV language is independent of builder UI language
    Given the builder's own interface is displayed in Portuguese
      (buttons, field labels, tooltips)
    When I set "CV language" to English
    Then the builder's own interface (buttons, field labels) remains in Portuguese
    And only the generated CV's structural text switches to English
```

## Open questions / to confirm

These require either direct access to a PT-BR/EN toggle on the reference site (not exposed at the entry point we tested) or product decisions on our side, since they weren't fully resolved during this pass of the walkthrough:

- Does the reference product expose a **separate site-UI language switcher** at all, or is the site's UI locale fixed per top-level domain (e.g., `cvmaker.pt` always serves PT-PT UI chrome, with region-specific sibling domains serving other UI locales)? This materially changes our own architecture decision.
- Is the CV-language list (PT/ES/EN/IT/FR) fixed, or does it expand based on which regional CVMaker domain the user is on?

## Requirements for our product (decided regardless of the above)

```gherkin
  Scenario: Our v1 ships Brazilian Portuguese, not European Portuguese
    Given our first release targets the Brazilian market
    Then all builder UI chrome (labels, buttons, tooltips, validation messages,
      section-writing "Tips") must use Brazilian Portuguese vocabulary and grammar
      (e.g. "Endereço" not "Morada"; "Currículo" and CV used as in Brazilian usage;
      "Carteira de motorista" not "Carta de condução")
    And no string should be a literal, un-reviewed translation copied from a
      European Portuguese reference — every string must be reviewed by someone
      fluent in Brazilian Portuguese before shipping

  Scenario: Architecture supports future locales without a rewrite
    Given we may need to support additional builder UI languages later
      (e.g. English for international users, Spanish for LatAm expansion)
    Then all user-facing strings in the application (not just CV template text)
      must be extracted into a translation-resource layer from day one
      (e.g. i18n keys, not hard-coded strings in components)
    And the CV-content-language mechanism (this feature) must be architected
      as a genuinely separate concern from the builder-UI-language mechanism,
      even if v1 only ships one UI language — so adding a second UI language
      later does not require re-touching the CV-rendering logic, and vice versa
```

## Nuances to design for

- **These are two independent axes, not one.** A robust implementation needs two separate, orthogonal settings: `builderUiLocale` and `cvContentLanguage`. Conflating them (as a naive implementation might, by driving both off one "language" setting) would break the exact use case this feature exists for.
- **CV content language must not attempt to machine-translate user-authored text.** It only swaps *product-owned* strings (section headings, any boilerplate like "References available upon request"). This boundary must be explicit in the data model — e.g., section titles are drawn from a translation table keyed by `cvContentLanguage` *unless* the user has manually renamed that section (see `15-section-management.md`), in which case the custom name is preserved verbatim regardless of language changes.
