# Feature: Courses & Certifications ("Cursos")

## Summary

An optional, repeatable section (added via the "+ extra section" mechanism, see `14-custom-sections.md`) for listing short courses, certifications, or professional-development credentials — distinct from formal Education (`06-education-qualifications.md`) which is meant for degrees. Structurally, it is nearly identical to Education: title, institution, date range, description.

## Why this feature exists

Certifications (cloud-vendor certs, professional-body qualifications, bootcamps, online-course completions) are increasingly important signals, especially in technical fields, and don't belong mixed into a "Formação e Qualificações" section meant for degrees — separating them lets a candidate who has, say, a single degree and five certifications give the certifications their own well-organized list rather than awkwardly appending them to their one education entry's description.

## Observed behavior

- Added via "+ Adicione uma secção extra" as **"Cursos."**
- Fields per entry: **Curso** (Course — placeholder "p. ex. Gestão Financeira"), **Instituição** (Institution — placeholder "p. ex. London Business School"), **Data de Início** / **Data de Término** (identical Month/Year select pattern as Experience/Education, including "Presente" and the month-granularity options on the end date), **Descrição** (rich text).
- **"+ Adicionar outro curso"** ("+ Add another course") appends further entries.
- Same Tips/Save/Remove pattern; saved entries collapse to a summary row, e.g. **"Certified Kubernetes Administrator (CKA) — setembro 2022 - julho 2022."**

## Functional requirements (Gherkin)

```gherkin
Feature: Courses and certifications
  As a job seeker
  I want to list short courses and professional certifications separately from
    my formal degrees
  So that employers can see both without either list becoming cluttered

  Background:
    Given I have added the "Courses" section to my CV via the
      "add an extra section" control

  Scenario: Adding a course/certification
    Then I see fields for Course/Certification name, Institution, Start date,
      End date, and a rich-text Description

  Scenario: Date handling matches Education and Work Experience
    Then Start date and End date behave identically to those sections'
      date controls, including "Present" and the date-granularity options

  Scenario: Adding, editing, deleting, and reordering multiple entries
    Then this section supports the same repeatable-entry lifecycle
      (add, edit, delete, drag-reorder) as every other repeatable section
```

## Nuances and edge cases to design for

- **This should reuse the same "repeatable timeline entry" component described in `06-education-qualifications.md`**, with a third field-set configuration (Curso/Instituição). Three sections (Experience, Education, Courses) all sharing one underlying component with different field labels is the correct architecture, not three separately maintained implementations.
- **A short course legitimately can start and end within the same short window** (even the same month), unlike a job or a degree — our date-overlap/reversed-date validation (proposed as an opportunity in `05-work-experience.md` and `06-education-qualifications.md`) must account for this and not flag legitimately-short courses as suspicious.

## Opportunities (where we should improve on the reference)

1. Consider a **"credential ID / verification URL" optional field** — many certifications (e.g. cloud platform certs) come with a public verification link or ID that recruiters can check; not present in the reference product but a genuinely useful, low-effort addition for this specific section.
