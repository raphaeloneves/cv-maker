import { useState, type FormEvent } from "react";
import { Button, Input } from "@/components/ui";
import { t } from "@/i18n";
import { getStoredLocale } from "@/lib/locale";
import { ApiError } from "@/lib/api-client";
import { logIn } from "@/domains/auth/api";

export function LoginForm() {
  const locale = getStoredLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await logIn({ email, password });
      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get("next") ?? "/dashboard";
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t(locale, "common.error.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        id="login-email"
        label={t(locale, "auth.login.email")}
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        id="login-password"
        label={t(locale, "auth.login.password")}
        type="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" loading={submitting} className="mt-1 w-full">
        {submitting ? t(locale, "auth.login.submitting") : t(locale, "auth.login.submit")}
      </Button>
    </form>
  );
}
