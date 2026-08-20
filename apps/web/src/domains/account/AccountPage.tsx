import type { AuthUser, BuilderLocale } from "@cv-maker/contracts";
import { Card, clsx } from "@/components/ui";
import { AppQueryProvider } from "@/lib/query-client";
import { RequireAuth } from "@/domains/auth/components/RequireAuth";
import { setStoredLocale } from "@/lib/locale";
import { updateLocale } from "@/domains/auth/api";
import { t } from "@/i18n";
import { useBuilderLocale } from "@/lib/use-builder-locale";

function formatDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === "pt-PT" ? "pt-PT" : "en-GB", { dateStyle: "long" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** The account setting that replaced the old nav-bar locale toggle (see
 * AppNav.astro's file comment) — same two-option pill radiogroup, active
 * option filled in white rather than a single button labeled with whatever
 * you'd switch *to*. `setStoredLocale` + a full reload is the same
 * mechanism the nav toggle used: `apps/web` is a static multi-page app with
 * no per-request server, so already-shipped text can only pick up the new
 * language on a fresh load (see src/lib/locale.ts). */
function LocaleSwitch({ current }: { current: BuilderLocale }) {
  async function select(next: BuilderLocale) {
    if (next === current) return;
    // Best-effort: also persist onto `user.locale` server-side, so the
    // cv-optimizer's report/rewrite language follows this same switch
    // instead of only ever matching whatever locale the account was created
    // with (see AuthUser's `locale` field). A network hiccup here shouldn't
    // block the UI chrome from switching, so it's never awaited-and-thrown.
    updateLocale(next).catch((err) => console.error("Failed to persist account locale", err));
    setStoredLocale(next);
    window.location.reload();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Switch language"
      className="inline-flex rounded-md border border-[var(--border-on-light)] bg-surface-sunken/60 p-0.5"
    >
      {(["en", "pt-PT"] as const).map((option) => {
        const isActive = option === current;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => select(option)}
            className={clsx(
              "mono-label rounded-[5px] px-2.5 py-1 text-[11px] transition-colors duration-fast ease-standard",
              isActive ? "bg-white text-navy-deep shadow-sm" : "text-text-muted hover:text-heading",
            )}
          >
            {option === "en" ? "EN" : "PT"}
          </button>
        );
      })}
    </div>
  );
}

function AccountBody({ user }: { user: AuthUser }) {
  const locale = useBuilderLocale();

  return (
    <div className="mx-auto max-w-[90rem] px-5 py-10 sm:px-8">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-heading">
        {t(locale, "account.title")}
      </h1>
      <p className="mt-1 text-sm text-text-muted">{t(locale, "account.subtitle")}</p>

      <Card className="mt-8 flex flex-col p-0">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border-on-light)] px-6 py-4">
          <span className="text-sm text-text-muted">{t(locale, "account.name")}</span>
          <span className="text-sm font-semibold text-heading">
            {`${user.firstName} ${user.lastName}`.trim() || "—"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border-on-light)] px-6 py-4">
          <span className="text-sm text-text-muted">{t(locale, "account.email")}</span>
          <span className="text-sm font-semibold text-heading">{user.email}</span>
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border-on-light)] px-6 py-4">
          <span className="text-sm text-text-muted">{t(locale, "account.locale")}</span>
          <LocaleSwitch current={locale} />
        </div>
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <span className="text-sm text-text-muted">{t(locale, "account.type")}</span>
          <span className="text-sm font-semibold text-heading">
            {t(locale, user.role === "admin" ? "account.role.admin" : "account.role.user")}
          </span>
        </div>
      </Card>

      <p className="mt-3 text-xs text-text-muted">
        {t(locale, "account.memberSince").replace("{date}", formatDate(user.createdAt, locale))}
      </p>

      <p className="mt-6 rounded-md bg-surface-sunken px-4 py-3 text-sm text-text-muted">
        {t(locale, "account.editNotYet")}
      </p>
    </div>
  );
}

/** `/account` — the authenticated app shell's account page. Real data
 * (email, builder locale, role, member-since) straight off the already-
 * resolved `AuthUser` from `<RequireAuth>`, no placeholder content. Editing
 * (email/password change, delete account) isn't built yet, said plainly
 * rather than shown as dead buttons. */
export function AccountPage() {
  return (
    <AppQueryProvider>
      <RequireAuth>{(user) => <AccountBody user={user} />}</RequireAuth>
    </AppQueryProvider>
  );
}
