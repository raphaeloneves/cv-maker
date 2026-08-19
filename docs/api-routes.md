# API route map (canonical)

This is the binding contract between `apps/api` and `apps/web`, built in
parallel by separate engineers. **Do not deviate from these paths, methods,
or payload shapes without updating this file first** — request/response
bodies are the DTOs already defined in `packages/contracts` (import them,
don't redefine). All routes except `POST /auth/*` and `GET /health` require
a valid access token (`Authorization: Bearer <token>`).

Base URL in dev: `http://localhost:4000`.

## Auth (`packages/contracts` → `auth.ts`)

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/auth/signup` | `SignUpInput` | `AuthSession` (sets refresh cookie) |
| POST | `/auth/login` | `LogInInput` | `AuthSession` (sets refresh cookie) |
| POST | `/auth/refresh` | — (reads refresh cookie) | `AuthSession` |
| POST | `/auth/logout` | — | `204` (clears refresh cookie) |
| GET | `/auth/me` | — | `AuthUser` |

Refresh token: httpOnly, `SameSite=None; Secure` cookie, name `cv_maker_refresh`.
Access token: returned in JSON body only, held in memory client-side (never
localStorage), sent as `Authorization: Bearer`.

## CVs (`cv.ts`)

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/cvs` | — | `Cv[]` (current user's CVs) |
| POST | `/cvs` | `CreateCvInput` | `Cv` (also provisions the 6 fixed built-in sections, see below) |
| GET | `/cvs/:cvId` | — | `Cv` |
| PATCH | `/cvs/:cvId` | `UpdateCvInput` | `Cv` |
| DELETE | `/cvs/:cvId` | — | `204` |

On `POST /cvs`, the server creates the 6 fixed sections (`profile_summary`,
`work_experience`, `education`, `skills`, `hobbies`, `references`) with
`deletable: false`, in that `sortOrder`, all initially empty/hidden:false.

## Personal info (`personal-info.ts`)

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/cvs/:cvId/personal-info` | — | `PersonalInfo \| null` |
| PUT | `/cvs/:cvId/personal-info` | `UpdatePersonalInfo` | `PersonalInfo` (upsert) |
| POST | `/cvs/:cvId/personal-info/photo` | multipart, field `photo` | `UploadPhotoResponse` |
| DELETE | `/cvs/:cvId/personal-info/photo` | — | `204` |

## Sections — generic (`sections/base.ts`)

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/cvs/:cvId/sections` | — | `Section[]`, ordered by `sortOrder`, each including its resolved title client-side via `resolveSectionTitle` (server returns the raw `displayName` override; the client resolves the default) |
| POST | `/cvs/:cvId/sections` | `CreateSection` (includes `clientRequestId`) | `Section` — **idempotent**: replaying the same `(cvId, clientRequestId)` returns the original section, never creates a second one |
| PATCH | `/cvs/:cvId/sections/:sectionId` | `UpdateSection` | `Section` |
| DELETE | `/cvs/:cvId/sections/:sectionId` | — | `204` — 409 if `deletable: false` |
| POST | `/cvs/:cvId/sections/reorder` | `ReorderSections` | `Section[]` |

## Section entries — one sub-resource per structured section type

Same 5-route shape for `work-experience`, `education`, `courses`, `skills`,
`languages`, `hobbies`, `references` — substitute `{kind}` and the matching
Upsert/Entry types from `packages/contracts` (e.g. `UpsertWorkExperienceEntry`
/ `WorkExperienceEntry` for `work-experience`):

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/sections/:sectionId/{kind}` | — | `{Kind}Entry[]` |
| POST | `/sections/:sectionId/{kind}` | `Upsert{Kind}Entry` | `{Kind}Entry` |
| PATCH | `/sections/:sectionId/{kind}/:entryId` | `Partial<Upsert{Kind}Entry>` | `{Kind}Entry` |
| DELETE | `/sections/:sectionId/{kind}/:entryId` | — | `204` |
| POST | `/sections/:sectionId/{kind}/reorder` | `{ orderedEntryIds: string[] }` | `{Kind}Entry[]` |

`{kind}` path segments: `work-experience`, `education`, `courses`, `skills`,
`languages`, `hobbies`, `references`.

## Freeform sections (`sections/freeform.ts`, `sections/profile-summary.ts`)

Covers `profile_summary`, `achievements`, `publications`, `custom` — one
rich-text body, no repeatable entries.

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/sections/:sectionId/freeform` | — | `{ description: string \| null }` |
| PATCH | `/sections/:sectionId/freeform` | `{ description: string \| null }` | `Section` |

## Templates (`templates.ts`)

`TEMPLATE_DEFINITIONS` is a static constant exported from
`@cv-maker/contracts` — **the frontend imports it directly, no API call**.
Only per-CV color preference is server state:

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/cvs/:cvId/template-preferences` | — | `CvTemplatePreference[]` |
| PUT | `/cvs/:cvId/template-preferences/:templateId` | `{ color: string }` | `CvTemplatePreference` |

Selecting a template (as opposed to just previewing its color) is
`PATCH /cvs/:cvId` with `{ templateId }`.

## Render data + export (`cv-render-data.ts`, `export.ts`)

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/cvs/:cvId/render-data` | — | `CvRenderData` — used by the live preview via `@cv-maker/cv-render`'s `<CvDocument>`. `watermarked` reflects the *viewer's own* entitlement, so preview never lies about what export will produce. |
| POST | `/cvs/:cvId/export` | — | `application/pdf` binary. Response headers `X-Watermarked: true\|false`, `X-Page-Count: <n>`. Always computed fresh from current data — never cached. |

## Billing (`billing.ts`)

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/billing/subscription` | — | `Subscription \| null` |
| POST | `/billing/checkout-session` | `CreateCheckoutSessionInput` | `CheckoutSessionResponse` |
| POST | `/billing/webhook` | raw Stripe event (signature-verified, `STRIPE_WEBHOOK_SECRET`) | `200` |

`hasActiveEntitlement(subscription, user.role)` (in `billing.ts`) is the
single gate used everywhere watermark/premium-template access is decided —
`role: 'admin'` always passes regardless of `subscription`.

## CV Optimizer (`cv-optimizer.ts`)

Pro-only feature: pick one of your CVs (or upload one as a PDF), give a role
title and a job description (pasted text or a URL, fetched server-side as
plain text before generation — never both), get back a Claude-generated
evaluation report — a pass/reject verdict against six recruiter objections,
plus the concrete fixes that would change it. This is an evaluation, not a
rewrite. Gated by the same `hasActiveEntitlement()` check as everything
else, not a separate credit balance. One report type, one Claude call
(`output_config.format` structured output) kicked off in the background
right after create — no job queue, poll `GET .../reports/:id` for status.

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/cv-optimizer/reports` | — | `CvOptimizerReportSummary[]`, newest first |
| GET | `/cv-optimizer/reports/:id` | — | `CvOptimizerReport` (full `reportContent` once `status: 'completed'`) |
| POST | `/cv-optimizer/reports` | `CreateCvOptimizerReportInput` (`cvId` required) | `CvOptimizerReport` with `status: 'pending'` — generation continues in the background |
| POST | `/cv-optimizer/reports/upload` | multipart: `roleTitle`, `jobDescriptionText` or `jobDescriptionUrl`, `cvFile` (PDF, max 8MB) | Same as above — `cvId` is `null`, `uploadedCvFileName` is set instead |

## Error shape

All 4xx/5xx responses: `{ "error": { "code": string, "message": string, "fields"?: Record<string, string> } }`.
`fields` is present for validation errors, keyed by the offending field path.
