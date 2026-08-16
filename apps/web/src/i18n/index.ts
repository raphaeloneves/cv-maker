import ptPT from "./pt-PT.json";
import en from "./en.json";
import type { BuilderLocale } from "@cv-maker/contracts";

/** Builder UI chrome strings only (nav, buttons, save state, etc) — fully
 * decoupled from `cvContentLanguage`, which drives on-CV section headings via
 * @cv-maker/contracts `resolveSectionTitle` instead. See features/03. */
const RESOURCES: Record<BuilderLocale, Record<string, string>> = {
  "pt-PT": ptPT,
  en,
};

export function t(locale: BuilderLocale, key: string): string {
  return RESOURCES[locale][key] ?? RESOURCES.en[key] ?? key;
}

export { RESOURCES };
