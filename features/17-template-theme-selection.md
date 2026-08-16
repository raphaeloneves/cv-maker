# Feature: Template & Theme Selection

## Summary

Step 3 of the builder (`#/tema/`, "Selecionar tema"). A grid of 9 distinct, fully-designed CV templates, each rendered live with the user's actual entered content and each offering its own small fixed palette of solid accent colors. Clicking a template opens a full first-page preview; a single "Descarregar CV" button at the bottom of the page proceeds to the paywall (`19-pricing-and-account.md`).

## Why this feature exists

Once the content is written, presentation is what determines whether a CV gets read at all — visual hierarchy, use of color, and layout convention (single column vs. sidebar) all affect skimmability and also need to match the norms of the industry/country being applied to (a creative-industry CV can afford a bold sidebar-and-color design; a conservative-industry or academic CV usually wants something closer to Auckland's plain monochrome). Offering several genuinely distinct, professionally designed layouts — rather than one layout with cosmetic color changes only — is what makes this step valuable rather than decorative.

## Observed behavior

### Template gallery
- **9 templates**, no pagination, arranged in a grid: **Auckland, Edinburgh (default/pre-selected), Princeton, Otago, Berkeley, Harvard, Stanford, Cambridge, Oxford.**
- No template is marked "Pro"/locked — all 9 are freely selectable regardless of payment status; gating happens later, at the payment step, not per-template.
- Each template is a genuinely distinct layout, not a re-skin of one base layout — observed differences include: single-column vs. two-column-with-sidebar; plain text section headers vs. icon-labeled headers; dot-meter vs. bar-meter vs. star-icon vs. plain-text-label ("Muito bom," "Bom") skill/language ratings; banner-style photo headers vs. inline photo blocks; timeline-with-dots vs. plain stacked entries for dated sections.

### Selecting and previewing
- Clicking a template card **simultaneously** marks it selected (highlighted border/checkmark) and opens a full-page preview showing the first page of the user's actual CV rendered in that template.
- Preview caption (verbatim): *"Uma amostra da primeira página do seu CV. Caso necessário, o seu CV será automaticamente dividido em múltiplas páginas, no momento da transferência."* — sets the expectation up front that overflow content auto-paginates at download time, rather than the user needing to manually manage page breaks (aside from the optional explicit "force page break" control from `15-section-management.md`).
- A confirm button inside the preview, labelled **"Selecione [TemplateName]"** (e.g. "Selecione Stanford"), and an **"×"** to close the preview without necessarily changing the selection.
- ⚠️ **Confirmed interaction defect**: the preview overlay is anchored to the top of the document rather than the current viewport. If the user has scrolled down the template grid (common, since it's a 9-item grid) before clicking a card, the preview opens off-screen with no visible change until the user manually scrolls back up — this reads as "nothing happened when I clicked," a real, reproducible bug worth avoiding in our implementation (position any such overlay relative to the viewport, not the document).

### Color customization
- Each template exposes its own **small, fixed set of solid accent colors** (4–6 swatches, varies per template) shown as clickable circles inside the preview — **not** a free-form color picker, and **not** a shared global palette across templates (each template's palette is curated to suit its own design).
- Color changes apply to the live preview **instantly**, with no loading delay — background/header fills, section-title accents, and skill-meter fills all recolor at once.
- The chosen color **persists per template** independent of which template is currently "selected" — e.g., tinting Stanford pink and then switching to another template keeps Stanford's thumbnail pink if the user returns to it later.

### What is explicitly NOT customizable at this step
- **No font/typography controls** — no font-family choice, no font-size control, confirmed absent via direct search of the page's interactive elements.
- **No composable layout controls** — no independent toggle for column count, sidebar position/side, spacing/density, photo visibility, or icon visibility. All such variation is achieved only by picking a different one of the 9 fixed templates, not by combining independent settings.
- **No AI-assisted or "recommended for you" template suggestion.**
- **No section-reordering control at this step** — reordering happens earlier, on the content step (see `15-section-management.md`); by the time a user reaches Tema, section order is already fixed from the previous step.

## Functional requirements (Gherkin)

```gherkin
Feature: Template and theme selection
  As a job seeker who has finished writing my CV content
  I want to choose a visual template and accent color
  So that my CV's presentation matches my personal style and the norms of
    the industry/market I'm applying to

  Background:
    Given I have completed the "CV content" step
    And I am on the "Template Selection" step

  Scenario: Browsing the template gallery
    Then I see a grid of distinct, fully-designed templates
    And one template is pre-selected by default

  Scenario: Previewing a template with my real content
    When I click a template card
    Then that template becomes the selected template
    And a full first-page preview opens, rendered using my actual entered
      CV content, not placeholder/lorem-ipsum text
    And I see a caption explaining that overflow content will automatically
      paginate at download time

  Scenario: The preview appears in view regardless of scroll position
    Given the template grid is scrolled down when I click a card
    Then the preview opens fully visible within my current viewport
      (this corrects a defect observed in the reference product, where the
      preview instead opened off-screen at the top of the document)

  Scenario: Changing the accent color
    Given a template's preview is open
    When I click a different color swatch
    Then the preview recolors instantly, with no perceptible loading delay
    And this color choice is remembered specifically for this template

  Scenario: Color choices are template-specific
    Given I set template "Stanford" to a pink accent color
    When I select a different template and later return to "Stanford"
    Then "Stanford" is still shown with the pink accent color I chose

  Scenario: No template is gated behind payment at this step
    Given I have not yet paid for anything
    Then I can select, preview, and recolor any of the available templates
      without being blocked or shown a paywall prompt

  Scenario: Proceeding to download
    Given I have a template selected
    When I click "Download CV"
    Then I am taken to the next step of the funnel (payment/account)
```

## Nuances and edge cases to design for

- **Templates are whole, curated designs, not composable style tokens** in the reference product — this is a legitimate, defensible product strategy (guarantees every template always looks professionally coherent, since users can't accidentally combine a busy layout with a clashing font), but it is also a real functional limitation compared to more flexible competitors. We should make this a deliberate choice, not a default born of not having built anything more flexible — see Opportunities.
- **The live preview must render using the user's actual data**, not a mock/lorem-ipsum sample — this is what makes the preview trustworthy and useful, and it must hold even for edge-case content (very long job titles, missing optional sections, a CV with only 2 sections filled in) without breaking the template's layout.

## Opportunities (where we should improve on the reference)

1. **Fix the off-screen/viewport-anchoring preview bug** as a hard requirement for our equivalent modal/overlay component.
2. **Consider adding a small number of independent, composable layout controls** on top of curated templates — e.g., photo visibility on/off, sidebar left/right (for templates where that's structurally sensible), and font-family choice from a small curated set — as a middle ground between "one rigid layout per template" and "infinite unstructured customization." This is a meaningful differentiation opportunity versus the reference product's all-or-nothing template-switching model.
3. **Consider a lightweight "recommended template" hint** based on the industry/role information already captured (e.g., job title in the most recent Experience entry) — not present in the reference product, but plausible given the data already exists in the CV by this step.
