# Feature: CV Export & Download

## Summary

The actual mechanism by which a finished CV leaves the builder and becomes a file the user can submit to an employer. In the reference product, every export path is gated behind payment (see `19-pricing-account-paywall.md`), so this file documents what could be directly confirmed about export *mechanics* (format, pagination behavior) plus what remains unverified because it sits past the paywall.

## Why this feature exists

Everything up to this point — personal info, content, template — exists in service of producing one artifact: a document the user can actually send to an employer or upload to a job portal. If export is unreliable (bad pagination, wrong format, broken layout) none of the upstream craftsmanship matters. This is the feature where quality is least forgiving of bugs, because the output is judged by a third party (the employer) the user cannot iterate in front of.

## Observed / confirmed behavior

- The primary export action is a single button, **"Descarregar CV"** ("Download CV," with a download-tray icon), at the bottom of the Template Selection step.
- Auto-pagination is explicitly communicated to the user **before** they ever see a paginated result, via the preview caption: *"Caso necessário, o seu CV será automaticamente dividido em múltiplas páginas, no momento da transferência."* ("If necessary, your CV will be automatically split across multiple pages, at the moment of download.") This implies pagination is computed at export time (from the live single-page preview), not maintained live as the user edits content.
- The right-hand panel of the subsequent payment screen shows a **live static render of the finished CV**, matching the currently selected template/color — confirming that whatever the user sees there is what the eventual download will reflect, i.e. the preview-before-paying is representative, not a lower-fidelity teaser.

## Not directly confirmed (gated behind payment; noted as open questions)

- **Exact file format(s) offered** — a PDF is all but certain given the "página"/pagination language and universal CV-export convention, but whether alternate formats (e.g. `.docx`, plain text, a shareable web link) are offered was not directly observed, since reaching an actual download requires completing payment, which was correctly avoided per this exercise's safety boundaries.
- **Whether a watermark is applied to any tier of export** — moot in the reference product specifically because there is no free export tier at all (see `19-pricing-account-paywall.md`), so the question "is the free export watermarked" doesn't apply there. It remains directly relevant to our own product if we choose to offer a free tier (see Opportunities).
- **Whether re-downloading after the initial purchase is unlimited**, and whether edits made after the first download are reflected in subsequent downloads without re-payment — implied yes by the benefits copy observed on the payment screen ("Modifique qualquer parte do seu CV," "Crie CVs ilimitados," full account access for the paid period), but not independently verified by completing a purchase.

## Functional requirements (Gherkin)

```gherkin
Feature: CV export and download
  As a job seeker who has finished writing and styling my CV
  I want to download it as a file I can send to employers
  So that all the work I put into the builder becomes something I can actually use

  Background:
    Given I have completed the "Personal Information," "CV Content," and
      "Template Selection" steps

  Scenario: Downloading produces a paginated, print-ready document
    Given my CV content is longer than fits on one page in the selected template
    When I download my CV
    Then the resulting file automatically splits my content across multiple
      pages at natural section boundaries, without manual intervention
    And a section with "force page break" enabled (see section management)
      always starts at the top of a new page in the output

  Scenario: The downloaded file matches the last-previewed template and color
    Given I selected the "Stanford" template with a pink accent color
    When I download my CV
    Then the downloaded file visually matches that exact template and color choice

  Scenario: Hidden sections are excluded from the export
    Given I have a section marked "hidden" (see section management)
    When I download my CV
    Then that section does not appear anywhere in the exported file

  Scenario: Re-downloading after edits
    Given I have already downloaded my CV once
    When I go back and edit a field, then download again
    Then the new download reflects my latest edits
```

## Nuances and edge cases to design for

- **Pagination correctness is the highest-stakes rendering problem in the whole product.** A section (or worse, a single entry within a section) that gets awkwardly split across a page boundary — a job title on one page and its bullet points on the next — looks broken to an employer and reflects badly on the candidate, not the tool, even though it's entirely the tool's fault. Both automatic "don't orphan a heading at the bottom of a page" logic and the manual "force page break" escape hatch (from `15-section-management.md`) need to work together robustly.
- **Export must be computed from the same data/rendering path as the live preview**, not a separate rendering pipeline — any divergence between "what I saw before downloading" and "what the file actually contains" is a serious trust-breaking bug class (e.g., a PDF-generation service that uses a different template engine than the in-browser preview is a common real-world source of this exact problem). Treat "preview and export must be pixel-equivalent" as a first-class non-functional requirement, not an implementation detail.

## Opportunities (where we should improve on the reference)

1. **Offer at least one genuinely free export path** (e.g., a watermarked PDF, or a lower-fidelity plain-text/basic-template export) rather than a 100%-paywalled download — see `19-pricing-account-paywall.md` for the full reasoning; this file's specific angle is that even a *watermarked* free PDF would meaningfully differentiate us and reduce the "I built a whole CV and can't even get a mediocre copy of it for free" frustration that the reference product's model creates.
2. **Confirm and, if needed, expand the format list** beyond PDF — a `.docx` export is a commonly requested feature (some ATS/HR workflows and some employers explicitly ask for editable Word files) worth prioritizing explicitly rather than leaving as PDF-only by default.
3. **Consider a shareable, view-only web link** as an additional "export" surface (increasingly common in modern CV tools) alongside file download — not observed in the reference product but worth evaluating as a differentiator.
