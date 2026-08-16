import { useEffect, useState } from "react";
import { AppQueryProvider } from "@/lib/query-client";
import { RequireAuth } from "@/domains/auth/components/RequireAuth";
import { PersonalInfoForm } from "@/domains/personal-info/components/PersonalInfoForm";
import { t } from "@/i18n";
import { getStoredLocale } from "@/lib/locale";
import { useCvId } from "@/lib/use-cv-id";

/** Root island mounted by `/builder/personal-info.astro`. Reads the `?cvId=`
 * query param (see `src/lib/use-cv-id.ts` — pages are static, so the CV id
 * travels client-side rather than via a dynamic route segment) and gates on
 * auth before rendering the form. `useCvId()` returns `null` both before its
 * own mount-effect resolves *and* when the param is genuinely absent, so a
 * separate `mounted` flag is what actually distinguishes "still resolving"
 * from "there really is no cvId" here. */
export function PersonalInfoStep() {
  const locale = getStoredLocale();
  const cvId = useCvId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="mono-label text-xs text-text-muted">{t(locale, "common.loading")}</p>
      </div>
    );
  }

  if (!cvId) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-danger">Missing CV id — go back to your dashboard and pick a CV.</p>
        <a href="/dashboard" className="mt-3 inline-block text-sm font-semibold text-orange">
          {t(locale, "nav.dashboard")} →
        </a>
      </div>
    );
  }

  return (
    <AppQueryProvider>
      <RequireAuth>{() => <PersonalInfoForm cvId={cvId} />}</RequireAuth>
    </AppQueryProvider>
  );
}
