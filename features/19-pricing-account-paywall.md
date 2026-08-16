# Feature: Account Creation, Pricing & Payment Gate

## Summary

The final screen of the funnel (`#/pagamento/`, "O seu CV está pronto!" — "Your CV is ready!"), reached only by clicking "Descarregar CV" on the Template step. There is **no login or signup screen anywhere earlier in the flow** — a user can complete personal info, all CV content, and template/color selection entirely anonymously. Account creation is bundled implicitly into this single payment screen: paying both unlocks the download **and** provisions an account (tied to the email captured back on the Personal Information step).

## Why this feature exists (and why its placement is a deliberate, aggressive choice)

Deferring any account/payment prompt until the user has a fully finished, previewed CV is a well-known conversion tactic: by the time someone hits this screen, they've invested real time and effort (personal info + full content + template/color choice), which makes them far more likely to pay than if they'd been asked to create an account or pay on page one. This is legitimate, common practice — but it is also, in the reference product's specific implementation, combined with **zero free export tier of any kind**, which pushes the tactic into "bait-and-switch" territory: a user cannot get so much as a watermarked copy of their own finished work without paying. This combination — not the deferred-gate pattern alone — is the specific choice we should make deliberately and differently (see Opportunities).

## Observed behavior

### Screen structure
- Heading: **"O seu CV está pronto!"**
- Subheading: *"Efetue pagamento para ganhar acesso à sua conta, onde pode editar e descarregar o seu CV."* ("Make a payment to gain access to your account, where you can edit and download your CV.")
- **Left panel — "Benefícios" (Benefits)**, each bullet with a green checkmark, verbatim:
  - Uma conta será criada (An account will be created)
  - Modifique qualquer parte do seu CV (Edit any part of your CV)
  - Crie CVs ilimitados (Create unlimited CVs)
  - Aceda a 361.817 vagas (Access 361,817 job openings) — implies an integrated, apparently live-updating job board bundled into the subscription
  - Temas de CV profissionais (Professional CV themes)
  - Envie e acompanhe as suas candidaturas de emprego (Submit and track your job applications) — implies a bundled application-tracking feature, and per the legal microcopy below, a **cover-letter builder** is also bundled
  - 14 dias de acesso total a todas as funcionalidades (14 days of full access to all features)
  - Renovação automática por € 19,99 / mês (Auto-renews at €19.99/month)
  - A subscrição pode ser cancelada a qualquer momento (Subscription can be cancelled anytime)
- **Right panel:** a live, static render of the user's actual finished CV, in the last-selected template and color — proof that what they're paying for is exactly what they previewed.

### Pricing (exact figures observed)
- **€1,99** upfront charge, buying **14 days of full access** (a trial period, not a one-time purchase).
- **Auto-renews at €19,99/month** thereafter unless cancelled.
- Single currency (EUR), single plan — no tiered plans (no Basic/Pro/Team), no annual-discount option observed.
- **No free tier exists at any point** — not a limited free download, not a watermarked PDF. This is a hard paywall, not a freemium model.

### Payment methods & form fields
- Two tabs: **"Visa/Mastercard"** and **"PayPal."**
- Card tab fields: **"Número de cartão"** (placeholder `1234 5678 9012 3456`), **"Data de validade"** (placeholder `MM/AA`), **"CVC / CVV"** (placeholder `3 dígitos`); accepted-network logos shown (approx. 8 icons, including Visa, Mastercard, Amex, Maestro, JCB, and others). Submit button: **"Pagar 1,99 €"** with a padlock icon.
- PayPal tab: no fields of its own; explanatory text directs the user to a relabeled primary button, **"Pagamento seguro"** ("Secure Payment"), presumably handing off to PayPal's own checkout/OAuth flow.

### Legal/consent microcopy (verbatim, small print directly beneath the payment button)
> "Consente que, ao clicar no botão 'Pagamento Seguro' e após o pagamento de 1,99 €, tenha início a execução dos serviços e possa efetuar imediatamente download do seu CV. Tem acesso completo, durante 14 dias, à sua conta, de forma a editar o seu CV, criar cartas de motivação ou utilizar as demais funcionalidades. Tem o direito de livre resolução do presente contrato dentro deste prazo de 14 dias, com observância do procedimento previsto na cláusula 13 dos Termos e Condições. Após este período de 14 dias, a sua conta será automaticamente renovada por 19,99 € por mês. Pode sempre cancelar a sua conta a qualquer momento."

This single paragraph does real legal/trust work: it names the exact charge amount at the moment of consent, discloses the auto-renewal amount and cadence in the same breath, references a specific contractual clause for the legal right of withdrawal, and reiterates that cancellation is always available — all directly adjacent to the pay button rather than buried elsewhere. This is a genuinely good practice worth keeping regardless of what pricing model we choose.

### Account creation mechanics
- **No email/password form was shown anywhere in the funnel before this point or on this screen itself** — the only email on file is the one captured on the Personal Information step (Step 1). Account provisioning is described as a side effect of successful payment ("Uma conta será criada"), not a separate signup step.
- **No OAuth/social login options** (Google, LinkedIn, Facebook, Apple) were observed — card and PayPal are the only two "authentication-adjacent" paths, and PayPal here functions purely as a payment method, not an identity provider.
- A **"Passo anterior"** (Previous step) link below the payment form returns to Template Selection without losing the selected template/color/entered content.

## Functional requirements (Gherkin)

```gherkin
Feature: Account creation and payment gate
  As a job seeker who has finished building and styling my CV
  I want to understand exactly what I'm paying for, how much, and how billing
    works, before I commit
  So that I can make an informed purchase decision with no surprises

  Background:
    Given I have completed Personal Information, CV Content, and Template
      Selection, entirely without being asked to create an account
    And I have clicked "Download CV" on the Template Selection step

  Scenario: No prior account gate exists
    Then I was able to reach this point — full CV content and a chosen
      template/color — without ever being shown a login or signup form

  Scenario: The payment screen shows a representative preview
    Then I see a live render of my actual CV, in my last-selected template
      and color, alongside the payment form

  Scenario: Benefits are disclosed before payment
    Then I see a clear list of what my payment unlocks (account access,
      editing, unlimited CVs, professional templates, job board access,
      application tracking, cover-letter tool, and the length of the
      included access period)

  Scenario: Pricing and renewal terms are disclosed before payment
    Then I see the exact upfront charge amount and what period it covers
    And I see the exact recurring amount and billing cadence that applies
      after that period, before I submit payment
    And I see that I can cancel at any time

  Scenario: Choosing a payment method
    When I select "Visa/Mastercard"
    Then I see fields for card number, expiry date, and CVC/CVV
    When I select "PayPal" instead
    Then I see an explanation that I'll be redirected to complete payment
      via PayPal, with no card fields shown

  Scenario: Consent language is shown adjacent to the pay action
    Then, directly beside the payment submission button, I see plain-language
      text confirming the exact charge, what it unlocks, the length and terms
      of any trial/access period, my right to cancel, and a reference to the
      applicable terms and conditions clause governing cancellation/refunds

  Scenario: Returning to the previous step preserves everything
    When I click "Previous step" from the payment screen
    Then I return to Template Selection with my chosen template, color, and
      all prior CV content fully intact

  Scenario: Account is provisioned as part of successful payment
    Given I complete payment successfully
    Then an account is created for me, associated with the email address I
      entered on the Personal Information step
    And I gain access to edit my CV, create additional CVs, and download,
      for the duration of my paid access period
```

## Nuances and edge cases to design for

- **The email captured on Personal Information (a CV *content* field) doubles as the account-identity field** in the reference product — this is an efficient reuse of data the user already provided, but it also means that field's purpose is quietly dual: "the email that appears on my CV" and "the email my account/billing is tied to" may not always be the same email a user would want (e.g., someone might want a professional email visible on their CV but a personal email for account/billing notifications). Worth a deliberate product decision on whether to keep this implicit reuse or add an explicit, separate "account email" field at the point of payment.
- **The progress stepper never represents this step** (see `16-builder-navigation-progress.md`) — from a pure information-architecture standpoint this screen is reachable and real, but invisible to the wizard's own navigation chrome, which is worth treating as a symptom of the same "don't warn the user a paywall is coming" strategy discussed above, rather than an unrelated oversight.
- **"361.817 vagas" (361,817 job openings) reads as a live/dynamic figure** — if we build a similar job-board cross-sell, that number needs a real, currently-accurate data source; a stale or obviously-static count undermines credibility fast.

## Opportunities (where we should improve on the reference)

1. **This is the single biggest strategic decision in the whole teardown: do we ship a genuine free tier, or match the reference product's zero-free-tier hard paywall?** The reference model (build everything for free, pay only to download, no free download at any quality level) reliably maximizes short-term conversion from users who complete the funnel, but it also means every user who *doesn't* convert leaves with literally nothing to show for their time — no goodwill, no watermarked sample, nothing shareable. A middle path (e.g., free watermarked PDF download always available; payment removes the watermark and/or unlocks premium templates, unlimited CVs, and the job-board/cover-letter bundle) is a legitimate, common alternative that trades some short-term conversion for materially better word-of-mouth, trust, and top-of-funnel volume. This decision should be made explicitly and early, since it shapes almost every other feature's gating logic (see `17-template-theme-selection.md` and `18-export-download.md`).
2. **Keep the reference product's genuinely good consent/disclosure microcopy pattern** (exact charge, exact renewal terms, and cancellation rights stated together, right next to the pay button) regardless of which pricing model we choose — this part is worth imitating closely, not just avoiding.
3. **Decide deliberately whether account email should default from the CV's contact email or be a distinct field at the payment step** — see the nuance above.
4. **If we keep a deferred-account-creation pattern**, ensure the progress indicator represents the true full journey (per the `16-builder-navigation-progress.md` recommendation) so the paywall itself doesn't feel concealed, even if the *timing* of asking for payment stays late in the funnel.
