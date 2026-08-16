# Feature: Skills ("Aptidões")

## Summary

A repeatable section listing individual skills (technical or soft), each paired with a self-rated proficiency level chosen from a fixed 5-point scale. Skills are typically rendered on the finished CV as a compact list, often with a visual meter/bar representing the chosen level.

## Why this feature exists

A flat list of skill names ("JavaScript, Leadership, Excel...") tells an employer *what* a candidate claims to know but nothing about *how well*. Pairing each skill with a self-assessed level gives the reader a fast, scannable signal of relative strength across a candidate's skill set — most useful when rendered visually (e.g. a bar or dot meter) rather than as text.

## Observed behavior

- Section header: **"Aptidões"**, icon.
- Fields per entry: **Aptidão** (Skill — free text, placeholder "p. ex. Microsoft Word") and **Nível** (Level — a `<select>`).
- The **Level dropdown offers exactly five options**, with these underlying values observed in the markup:

  | Label (PT-PT) | Underlying value |
  |---|---|
  | Experiente | 100 |
  | Com experiência | 75 |
  | Com alguma experiência | 50 |
  | Principiante | 25 |
  | Novato | 20 |

  Note the **uneven spacing**: four levels are 25 points apart (100/75/50/25) but the bottom level ("Novato") is only 5 points below "Principiante" (25 → 20), not a further 25. If this value drives a rendered meter width/fill, "Principiante" and "Novato" would render almost indistinguishably (80% vs. 100% of the gap to zero, rather than a clean 4-step ladder) — flagged as a defect to deliberately avoid, not a pattern to imitate.
- **"+ Adicionar outra aptidão"** ("+ Add another skill") appends further entries; unlimited entries supported.
- Same per-entry **Save / Remove** pattern (no "Tips" button was observed on this section, unlike Profile/Experience/Education — skills entries appear simple enough not to warrant writing guidance).
- Saved entries collapse to a summary row: **skill name (bold)** with the **chosen level label** underneath, e.g. **"JavaScript / TypeScript — Experiente."**

## Functional requirements (Gherkin)

```gherkin
Feature: Skills with proficiency rating
  As a job seeker
  I want to list my skills along with a self-assessed proficiency level
  So that employers can quickly gauge my relative strengths

  Background:
    Given I am on the "CV content" step of the builder
    And the "Skills" section is visible

  Scenario: Adding a skill
    When I type a skill name and choose a proficiency level
    And I save the entry
    Then the entry collapses to a summary row showing the skill name and its level

  Scenario: The proficiency scale has five fixed levels
    When I open the "Level" dropdown
    Then I see exactly five ordered options, from highest to lowest proficiency

  Scenario: Adding multiple skills
    Given I have saved one skill
    When I click "Add another skill"
    Then a new blank entry appears, independent of the first

  Scenario: Editing, deleting, and reordering skills
    Given I have two or more saved skills
    Then I can edit, delete, and drag-reorder them
      exactly as in Work Experience and Education

  Scenario: A skill entry requires a name to be meaningful
    Given I have selected a proficiency level but left the skill name blank
    When I attempt to save
    Then I am not able to save an unnamed skill entry
      (name should be effectively required even if not marked with an asterisk,
      since a level with no label is meaningless on the rendered CV)
```

## Nuances and edge cases to design for

- **The five proficiency levels must be evenly spaced in our implementation**, not copied verbatim from the reference product's 100/75/50/25/20 scale. Use a clean, evenly distributed scale (e.g. 100/80/60/40/20, or simply ranks 5/4/3/2/1 driving a 5-segment meter) so every level renders as a visually distinct, proportional step.
- **Skill name is free text with no autocomplete/suggestions observed**, meaning duplicate or near-duplicate skills (e.g. "JS" and "JavaScript" as two separate entries) are entirely possible and not prevented by the product. Worth a deliberate decision on our side about whether to add lightweight duplicate detection or a curated-suggestions autocomplete (see Opportunities).

## Opportunities (where we should improve on the reference)

1. **Fix the scale spacing** as described above — this is a straightforward, low-risk improvement over the reference implementation.
2. **Consider a searchable autocomplete for common skill names** (with the freedom to still type anything not in the list), which would both speed up entry and reduce near-duplicate skill entries, and could double as a lightweight taxonomy for any future skill-matching/search features.
3. **Consider warning on exact-duplicate skill names** within the same CV.
