import { useState, type FormEvent } from "react";
import type { BuilderLocale } from "@cv-maker/contracts";
import { Button, Input, Select, clsx } from "@/components/ui";
import { t } from "@/i18n";
import { getStoredLocale, setStoredLocale } from "@/lib/locale";
import { ApiError } from "@/lib/api-client";
import { signUp, CURRENT_TERMS_VERSION } from "@/domains/auth/api";

/** Signup: email/password + an explicit, visible terms-acceptance checkbox
 * that records `acceptedTermsVersion` — a real consent record, not the
 * reference product's implicit "clicking Next step means you agreed"
 * pattern (features/16's flagged legal gap). The checkbox is unchecked by
 * default and blocks submission until checked. */
export function SignupForm() {
  const locale = getStoredLocale();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cvLocale, setCvLocale] = useState<BuilderLocale>(locale);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (password !== confirmPassword) {
      setFormError(t(locale, "auth.signup.error.passwordMismatch"));
      return;
    }
    if (!termsAccepted) {
      setFormError(t(locale, "auth.signup.error.termsRequired"));
      return;
    }

    setSubmitting(true);
    try {
      setStoredLocale(cvLocale);
      await signUp({
        firstName,
        lastName,
        email,
        password,
        locale: cvLocale,
        acceptedTermsVersion: CURRENT_TERMS_VERSION,
      });
      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get("next") ?? "/dashboard";
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        if (err.fields) setFieldErrors(err.fields);
      } else {
        setFormError(t(locale, "common.error.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="signup-first-name"
          label={t(locale, "auth.signup.firstName")}
          required
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          error={fieldErrors.firstName}
        />
        <Input
          id="signup-last-name"
          label={t(locale, "auth.signup.lastName")}
          required
          autoComplete="family-name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          error={fieldErrors.lastName}
        />
      </div>
      <Input
        id="signup-email"
        label={t(locale, "auth.signup.email")}
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
      />
      <Input
        id="signup-password"
        label={t(locale, "auth.signup.password")}
        type="password"
        required
        minLength={10}
        autoComplete="new-password"
        hint={t(locale, "auth.signup.passwordHint")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
      />
      <Input
        id="signup-confirm-password"
        label={t(locale, "auth.signup.confirmPassword")}
        type="password"
        required
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <Select
        id="signup-locale"
        label={t(locale, "auth.signup.locale")}
        value={cvLocale}
        onChange={(e) => setCvLocale(e.target.value as BuilderLocale)}
      >
        <option value="en">English</option>
        <option value="pt-PT">Português (PT)</option>
      </Select>

      <label htmlFor="signup-terms" className="flex items-start gap-2.5 text-sm text-body">
        <input
          id="signup-terms"
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border-on-light)] text-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-orange/40"
        />
        <span>
          {t(locale, "auth.signup.terms.prefix")}{" "}
          <a href="/terms" target="_blank" rel="noreferrer" className="font-medium text-orange underline underline-offset-2">
            {t(locale, "auth.signup.terms.termsLink")}
          </a>{" "}
          {t(locale, "auth.signup.terms.and")}{" "}
          <a href="/privacy" target="_blank" rel="noreferrer" className="font-medium text-orange underline underline-offset-2">
            {t(locale, "auth.signup.terms.privacyLink")}
          </a>
          .
        </span>
      </label>

      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" loading={submitting} className={clsx("mt-1 w-full")}>
        {submitting ? t(locale, "auth.signup.submitting") : t(locale, "auth.signup.submit")}
      </Button>
    </form>
  );
}
