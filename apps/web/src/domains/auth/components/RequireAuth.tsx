import { useEffect, useState, type ReactNode } from "react";
import type { AuthUser } from "@cv-maker/contracts";
import { refreshSession, setOnAuthExpired } from "@/lib/api-client";
import { t } from "@/i18n";
import { useBuilderLocale } from "@/lib/use-builder-locale";

type Status = "loading" | "authed" | "redirecting";

/**
 * Gate for every protected React island (dashboard, all 4 builder steps).
 * `apps/web` is a static multi-page app, so the in-memory access token does
 * not survive a page navigation — this silently re-derives one from the
 * httpOnly refresh cookie via `refreshSession()` on mount, before rendering
 * `children`. If that fails (no valid session), it redirects to `/login`
 * with a `next` param so login can bounce the user back afterwards. Also
 * registers the one app-wide `onAuthExpired` handler so a mid-session token
 * expiry (refresh-on-401 failing inside a later mutation) redirects the
 * same way instead of the UI silently failing.
 */
export function RequireAuth({ children }: { children: (user: AuthUser) => ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const locale = useBuilderLocale();

  useEffect(() => {
    let cancelled = false;

    function redirectToLogin() {
      if (cancelled) return;
      setStatus("redirecting");
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?next=${next}`;
    }

    setOnAuthExpired(redirectToLogin);

    refreshSession().then((session) => {
      if (cancelled) return;
      if (session) {
        setUser(session.user);
        setStatus("authed");
      } else {
        redirectToLogin();
      }
    });

    return () => {
      cancelled = true;
      setOnAuthExpired(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status !== "authed" || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="mono-label text-xs text-text-muted">{t(locale, "common.loading")}</p>
      </div>
    );
  }

  return <>{children(user)}</>;
}
