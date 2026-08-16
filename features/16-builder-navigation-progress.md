# Feature: Multi-Step Builder Navigation & Progress Indicator

## Summary

The whole CV-creation flow is a small, linear sequence of full-page steps — confirmed to be **Personal Info → CV Content → Template Selection → Payment** — tied together by a persistent progress indicator at the top of each page and a "Next step" / "Previous step" control pair at the bottom.

## Why this feature exists

A CV takes real effort to complete — likely several minutes across many fields — so users need constant, low-effort orientation: how many steps are there, which one am I on, and can I go back without losing what I've done. A wizard with a visible stepper does this far better than, say, one giant scrolling page or a set of unlabelled tabs.

## Observed behavior

- **Route structure** (hash-based client-side routing):
  1. `#/informacao-pessoal/` — page heading "Detalhes pessoais," stepper node "Pessoal"
  2. `#/historico/` — page heading "As minhas experiências," stepper node "Experiências" — **note the URL segment ("historico" / "history") does not match either the page heading or the stepper label ("Experiências").** This is an internal/external naming mismatch, presumably a leftover from an earlier product iteration where this step may have been framed around "history" rather than the current broader "content builder" framing.
  3. `#/tema/` — page heading "Selecionar tema," stepper node "Tema"
  4. `#/pagamento/` — page heading "O seu CV está pronto!" — **this step has no stepper node at all.** It's reached only via the "Descarregar CV" button at the bottom of the Tema step, not via the visible 3-node progress tracker, meaning the paywall is functionally hidden from the progress indicator.
- **Stepper visual:** three icon nodes (person / document / pencil-and-paper, matching Pessoal / Experiências / Tema) connected by a line; the current and completed steps are visually distinguished (filled/colored) from upcoming ones.
- **Forward navigation:** a primary **"Próximo passo"** ("Next step") button at the bottom of each step, disabled/blocking only when required fields on the current step are incomplete (confirmed on step 1; not separately re-verified on step 2, but the same required-field pattern is assumed to apply based on consistent product behavior).
- **Backward navigation:** a secondary **"Passo anterior"** ("Previous step") link beneath the primary button on every step observed, including the payment step — going back does not discard data entered on the step you're leaving.
- On the Personal Info step specifically, small print beneath the buttons reads: *"Antes de clicar no próximo passo, por favor reveja os nossos termos gerais e política de privacidade. Ao iniciar a criação do seu cv, confirma que leu e que concorda com os nossos termos gerais e política de privacidade."* — i.e., clicking "Next step" for the first time is treated as implicit agreement to the Terms and Privacy Policy, linked inline, with no separate checkbox/consent gate.

## Functional requirements (Gherkin)

```gherkin
Feature: Multi-step builder navigation
  As a user building my CV
  I want a clear, persistent sense of which step I'm on and how many remain
  So that I can navigate the process confidently and never lose my progress

  Background:
    Given I am anywhere in the CV builder flow

  Scenario: Progress indicator reflects the current step
    Given I am on the "Personal Information" step
    Then the progress indicator highlights "Personal" as the active step
    And shows "Content" and "Template" as upcoming steps

  Scenario: Advancing to the next step
    Given all required fields on the current step are complete
    When I click "Next step"
    Then I am taken to the next step in the sequence
    And the progress indicator updates to reflect the new current step

  Scenario: Blocked from advancing with incomplete required fields
    Given a required field on the current step is empty
    When I click "Next step"
    Then I remain on the current step
    And the incomplete required field is visually indicated

  Scenario: Returning to a previous step preserves data
    Given I am on the "Template Selection" step
    When I click "Previous step"
    Then I return to the "CV Content" step
    And all previously entered sections and entries are exactly as I left them

  Scenario: First-time advancement implies terms acceptance
    Given this is my first time clicking "Next step" in a new CV
    Then I see a notice that proceeding constitutes agreement to the
      Terms and Privacy Policy, with links to both documents
    And there is no separate checkbox required beyond clicking "Next step" itself

  Scenario: The payment/paywall step is reached, not stepped-to
    Given I am on the "Template Selection" step with a template chosen
    When I click the primary "Download CV" call to action
    Then I am taken to a payment step
    But this step does not correspond to any node in the visible progress
      indicator — the indicator only ever shows the three content-building steps
```

## Nuances and edge cases to design for

- **The payment step being invisible in the progress indicator is a meaningful UX/trust decision, not just an oversight** — whether intentional or not in the reference product, its effect is that a user has no advance warning, anywhere in the visible stepper, that a paywall is the very next screen after finishing template selection. We should decide *deliberately* whether to replicate this or to represent the paywall honestly in our own progress indicator (see Opportunities and `19-pricing-and-account.md`).
- **Route-to-label naming should stay consistent in our implementation** — the reference product's `#/historico/` vs. "Experiências" mismatch is a small but real signal of technical debt; keep our own route slugs, page headings, and stepper labels in lock-step (e.g., driven from one shared constant/config per step) so they can never silently drift apart as the product evolves.
- **Terms/privacy consent-by-continuing (no explicit checkbox) is a legally load-bearing pattern** — if we adopt it, the exact wording and placement (directly beneath the primary CTA, with inline links, shown before the first-ever "Next step" click) matters for whether it holds up as valid consent under Brazilian consumer-protection and data-privacy law (LGPD). This should be reviewed with legal/compliance rather than assumed safe to copy verbatim just because a similar pattern exists in the PT-PT reference product operating under EU/Portuguese law.

## Opportunities (where we should improve on the reference)

1. **Represent every real step — including payment — in the progress indicator**, so users aren't surprised by a paywall that the navigation UI never hinted at. This is one of the clearest, most user-trust-relevant improvements identified across this entire teardown.
2. **Keep route/heading/stepper-label naming consistent** from day one (see nuance above) as a basic engineering-hygiene requirement.
3. **Get explicit legal review on the "continuing implies consent" pattern** for our jurisdiction before shipping it, rather than assuming the reference product's approach is automatically compliant for us.
