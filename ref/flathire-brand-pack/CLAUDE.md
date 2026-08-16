# CLAUDE.md — Flathire Project Context

This file gives Claude Code the context it needs to work on the Flathire project
without losing the decisions, reasoning, and constraints established in prior sessions.

Read this fully before touching any file.

---

## What Flathire is

A pre-launch technology talent agency. The core disruption is a flat monthly fee model
that replaces the traditional 15 to 20% per-hire agency fee structure. Founder has a
deep engineering leadership background and personally vets every candidate. Pre-launch
as of the time this file was written.

Target market: Series A and B startups, PE-backed companies, 10 to 150 people,
hiring technology talent across the US and EMEA. Primary buyers are CEO/Founders,
CTOs, and VP/Directors of Engineering.

---

## Business model

### Pricing tiers

| Plan | Price | Active roles |
|---|---|---|
| Starter | $2,500/month | Up to 3 |
| Scale | $4,000/month | Up to 6 |
| Growth | $4,000 base + $1,000/role beyond 6 | 7+ |

**Active roles** means roles being worked simultaneously at any given moment.
As a role is filled, the next one rotates in automatically.

Growth plan is not displayed with a dollar amount on the pricing page. It shows
"Contact us" as the price, with a "Let's talk" CTA. The formula is known internally
and surfaces in the ROI calculator but not in the static card.

### Key differentiators

- Candidates are sent immediately after screening, never batched
- Shortlists of 3 to 5 candidates per role, never pipelines of 10+
- Founder has an engineering background and vets on technical judgment, not keywords
- Same flat fee whether the client fills 1 role or 5 in a given month

### ROI framing (use this in copy)

A single $150k technology hire at 18% agency fee costs $27,000. Flathire's Starter
plan over 3 months costs $7,500. That is the number that drives conversion.

Traditional agency (18%) vs Flathire benchmarks:
- 1 hire at $150k: $27,000 vs ~$7,500 (3 months Starter)
- 3 hires at $150k: $81,000 vs $7,500 (1 quarter Starter)
- 6 hires at $150k: $162,000 vs $12,000 (1 quarter Scale)
- 9 hires at $150k: $243,000 vs $42,000 (Growth, 6 months)

Note: these figures use $150k as a representative salary and 18% as the agency rate.
Both are illustrative. Do not present them as industry-verified statistics without
flagging that they are estimates based on a representative scenario.

### Pricing model status

The model has not been validated with real paying clients. Pricing decisions at this
stage are about customer acquisition and model proof, not margin optimization.
Do not over-engineer the pricing logic until there is real client feedback.

---

## Brand

### Name and domain

Brand name: **Flathire**
Preferred domain: flathire.agency (confirmed available at time of project start)
Do not assume current availability. Verify before any copy that references the domain.

### Logo

Wordmark only. "flat" in white (or navy on light backgrounds), "hire" in orange
`#E8640C`. Set in Syne 800 weight. There is also a standalone favicon mark: a
lowercase "f" in orange on a rounded navy square, traced from the real Syne
ExtraBold font outlines.

### Color tokens

| Token | Hex |
|---|---|
| Navy Deep | `#0A1628` |
| Navy Mid | `#1B3A6B` |
| Navy Light | `#243F72` |
| Orange | `#E8640C` |
| Orange Warm | `#F4A261` |
| Ice | `#E8EDF5` |
| White | `#FFFFFF` |
| Muted | `#8A9BBF` |
| Border | `rgba(232,237,245,0.12)` |

Dark sections use Navy Deep background, Ice body text, White headlines, Orange accents.
Light sections use Ice background, Navy Deep headlines, `#4A5568` body copy.

### Typography

| Role | Font | Weights |
|---|---|---|
| Display | Syne | 700, 800 |
| Body | Inter | 300, 400, 500, 600 |
| Mono / data | IBM Plex Mono | 400, 500 |

The landing page is fully self-contained: all three fonts are embedded as base64
woff2 data URIs inside `<style>` tags. There are no external font requests.
Do not add Google Fonts links. If new weights are needed, embed them the same way.

### Voice rules

- Direct and founder-fluent. No recruiting industry jargon.
- No em dashes anywhere in copy. Use commas, periods, or restructure the sentence.
- Never say: "world-class talent", "best in class", "passive candidates",
  "culture add", "end to end recruitment solutions", "we're different because we care"
- Confident without arrogance. Does not oversell.
- Numbers and the cost-saving story do the heavy lifting, not adjectives.

---

## Website (index.html)

### Architecture

Single self-contained HTML file. No build system, no dependencies, no external
requests of any kind. Everything (fonts, favicon, all CSS, all JS) is inline.
This is intentional. The file is designed to be dropped directly into GitHub Pages
as `index.html` with zero configuration.

Do not introduce external CDN links, npm dependencies, or a build step without
explicit discussion. The simplicity is a feature.

### Sections in order

1. Fixed nav (logo, links: How it works, Pricing, ROI Calculator, CTA: Book a call)
2. Hero (two-column: headline + copy left, floating dashboard illustration right)
3. Trust bar (segment chips: Series A/B, PE-backed, Venture-backed, 10-150 people)
4. Problem section (light background, cost math, 4 problem cards with icons)
5. Pillars (3 columns: technology credibility, shortlist discipline, flat fee)
6. ROI Calculator (interactive sliders: salary, hires, months; live savings output)
7. How it works (milestone track with 4 steps, animated progress line)
8. Pricing (3 cards: Starter, Scale, Growth/Contact us)
9. Final CTA
10. Footer

### Favicon

Three `<link>` tags in `<head>`:
- SVG favicon (modern browsers) as base64 data URI
- PNG 32x32 fallback as base64 data URI
- Apple touch icon as base64 data URI

For Google Search to pick up the favicon correctly, a real `favicon.ico` file
should also exist at the repo root (separate from the embedded version).
The embedded version handles browser tabs. The root file handles search engine
indexing. Both are needed.

### ROI Calculator logic

```
if hires <= 3:  plan = Starter, monthly = 2500
if hires <= 6:  plan = Scale,   monthly = 4000
if hires >= 7:  plan = Growth,  monthly = 4000 + (hires - 6) * 1000

agency_cost = salary * 0.18 * hires
flat_cost   = monthly * months   (minimum months = 2)
saving      = agency_cost - flat_cost
```

The calculator surfaces the Growth formula dynamically because the user has
explicitly asked for a number. The static pricing card does not show the formula.

### Max-width and alignment

All sections use `max-width: 1100px` with `margin: 0 auto` and `padding: 0 60px`.
The hero inner also uses `max-width: 1100px; margin: 0 auto`. These must stay
consistent or the left edge of the hero will not align with other sections on desktop.
This was a known bug that was fixed. Do not revert it.

### Responsive breakpoints

- Below 900px: hero visual hidden, grids collapse to single column, nav links hidden
- Below 500px: stats stack, milestone steps go single column

---

## Assets in the project

If working in a repo, expect these files:

```
index.html                  — The landing page (self-contained)
CLAUDE.md                   — This file
assets/
  logo/
    flathire-logo-light.svg — White/orange wordmark (for dark backgrounds)
    flathire-logo-dark.svg  — Navy/orange wordmark (for light backgrounds)
    flathire-logo-orange.svg — Monochrome orange wordmark
    flathire-logo-white.svg  — Monochrome white wordmark
    flathire-logo-light.png  — PNG versions (2400px wide, transparent)
    flathire-logo-dark.png
    flathire-logo-orange.png
    flathire-logo-white.png
    favicon/
      favicon.svg            — Square icon mark (f on navy rounded square)
      favicon.ico            — Multi-resolution ICO (16, 32, 48px)
      favicon-16x16.png
      favicon-32x32.png
      apple-touch-icon.png   — 180x180px for iOS home screen
  linkedin-banner/
    flathire-linkedin-banner.png          — 1584x396, text left / illustration right
    flathire-linkedin-banner-2x.png       — 3168x792 retina version
    flathire-linkedin-banner-mirrored.png — 1584x396, illustration left / text right
    flathire-linkedin-banner-mirrored-2x.png
  brand/
    flathire-brand-positioning.md         — Full brand positioning and brand kit doc
```

---

## What has been decided and should not be reopened without good reason

These are settled decisions. Do not relitigate them without new information or
explicit instruction from the founder.

- **Name:** Flathire. Checked against competitors. No direct conflicts found at
  time of research, but this should be verified again before trademark filing.
- **Model:** flat monthly fee, no percentage per hire. This is the core disruption.
  Do not suggest adding a per-placement fee.
- **Growth plan pricing display:** "Contact us", not a dollar amount on the card.
  The formula lives in the calculator only.
- **No em dashes in copy.** This is a hard rule across all content.
- **Self-contained HTML.** No build system, no external dependencies.
- **Font embedding:** base64 woff2 inline. Do not revert to Google Fonts links.
- **Section order:** established and tested. Do not reorder without explicit request.
- **"What we do vs what we don't do" section:** considered and explicitly rejected
  by the founder. Do not reintroduce it.

---

## What is still open and needs real-world validation

- Pricing tiers (may adjust after first 2-3 paying clients give feedback)
- Scale ceiling: currently 6 roles. May drop to 5 pending real capacity data.
- Whether Growth's $1,000/role-beyond-6 formula holds once the candidate pool
  matures and sourcing hours per role decrease
- Domain: flathire.agency was available at time of research. Verify current status.
- Trademark availability: not formally checked. Do not assume it is clean.

---

## Things to be careful about

- The ROI figures ($27,000 per hire, 60% saving, etc.) are illustrative estimates
  based on a $150k salary and 18% agency rate. They are not sourced from industry
  research. Do not present them as verified industry statistics.
- The business is pre-launch. Do not write copy that implies existing clients,
  proven results, or a track record that does not yet exist.
- The candidate pool that justifies the capacity math does not exist yet.
  It will build over the first 2-3 months of real operation.
- The founder is solo by design. Do not suggest team-based workflows or processes
  that assume additional headcount.
