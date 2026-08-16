/**
 * Client-side `builderUiLocale` preference (see features/03-internationalization.md
 * and packages/contracts/src/enums.ts:builderLocaleSchema). Fully decoupled
 * from `cvContentLanguage` — this is only ever about the app's own chrome.
 *
 * `apps/web` ships as a static multi-page app (no Astro SSR), so there is no
 * per-request server that could pick a locale at render time. The pattern
 * used throughout this app instead:
 *  - Astro pages render their static copy in `DEFAULT_LOCALE` at build time,
 *    tagging translatable text nodes with `data-i18n="<key>"`.
 *  - `LocaleHydration.astro` (included once by `BaseLayout`) runs on every
 *    page load, reads the stored preference via `getStoredLocale()`, and — if
 *    it differs from `DEFAULT_LOCALE` — swaps those text nodes' content from
 *    the same `RESOURCES` map `t()` uses, so there is exactly one source of
 *    translated strings, never a second i18n mechanism.
 *  - React islands (nav, forms, dashboard) read `getStoredLocale()` once on
 *    mount and call `t(locale, key)` directly, re-rendering already in the
 *    right language with no hydration flash.
 *  - The nav's locale toggle calls `setStoredLocale()` then reloads the page
 *    so both static and island content re-render consistently.
 */
import type { BuilderLocale } from "@cv-maker/contracts";

export const DEFAULT_LOCALE: BuilderLocale = "en";
// Shared with src/lib/use-builder-locale.ts (that module's own docstring
// documents it reading this same key, written by the nav's locale toggle
// owned here) — keep this key in sync across both modules.
const STORAGE_KEY = "cv_maker_builder_locale";

function isBuilderLocale(value: string | null): value is BuilderLocale {
  return value === "pt-PT" || value === "en";
}

/** Safe to call during SSR/build (returns `DEFAULT_LOCALE`) and in the browser. */
export function getStoredLocale(): BuilderLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return isBuilderLocale(raw) ? raw : DEFAULT_LOCALE;
}

export function setStoredLocale(locale: BuilderLocale): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, locale);
}

export function otherLocale(locale: BuilderLocale): BuilderLocale {
  return locale === "en" ? "pt-PT" : "en";
}
