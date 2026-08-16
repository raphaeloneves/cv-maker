import { useEffect, useState } from "react";
import type { BuilderLocale } from "@cv-maker/contracts";
import { getStoredLocale } from "@/lib/locale";

/** React-hook wrapper around the canonical `getStoredLocale()` (see
 * `src/lib/locale.ts`, owned by the other frontend engineer — this module
 * only ever reads that value; the locale switcher itself lives in the nav
 * chrome under `components/nav/**`). Kept as a thin hook here so every
 * section/template/billing component in this slice can call one hook
 * instead of re-reading localStorage + subscribing to `storage` events
 * itself. */
export function useBuilderLocale(): BuilderLocale {
  const [locale, setLocale] = useState<BuilderLocale>("en");
  useEffect(() => {
    setLocale(getStoredLocale());
    function onStorage(e: StorageEvent) {
      if (e.key === null || e.key === "cv_maker_builder_locale") setLocale(getStoredLocale());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return locale;
}

export { getStoredLocale };
