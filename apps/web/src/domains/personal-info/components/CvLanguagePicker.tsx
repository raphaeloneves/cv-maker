import { cvContentLanguageSchema, type CvContentLanguage } from "@cv-maker/contracts";
import { clsx } from "@/components/ui";
import { t } from "@/i18n";
import type { BuilderLocale } from "@cv-maker/contracts";

const LABELS: Record<CvContentLanguage, string> = {
  en: "EN",
  "pt-PT": "PT",
};

interface CvLanguagePickerProps {
  locale: BuilderLocale;
  value: CvContentLanguage;
  onChange: (value: CvContentLanguage) => void;
}

/** A segmented pill toggle, not a full labeled `<select>` — `cvContentLanguage`
 * only has two options today, and a dropdown-with-wrapping-label crammed into
 * a narrow header slot (the earlier implementation) reads as visually noisy
 * and unclear next to the save-status pill. Matches the same compact toggle
 * language already used for the builder-UI locale switch in the site nav, so
 * the pattern for "this control changes a language, but not the page you're
 * reading" stays consistent app-wide. Grows to a labeled `<select>`
 * automatically if a third CV content language is ever added, since mapping
 * over `cvContentLanguageSchema.options` beyond two entries stops reading as
 * a toggle — not needed while there are exactly two. */
export function CvLanguagePicker({ locale, value, onChange }: CvLanguagePickerProps) {
  const options = cvContentLanguageSchema.options;

  return (
    <div className="flex flex-col items-end gap-1">
      <span className="mono-label text-[10px] text-text-muted" title={t(locale, "personalInfo.cvLanguage.hint")}>
        {t(locale, "personalInfo.cvLanguage")}
      </span>
      <div
        role="radiogroup"
        aria-label={t(locale, "personalInfo.cvLanguage")}
        title={t(locale, "personalInfo.cvLanguage.hint")}
        className="inline-flex rounded-md border border-[var(--border-on-light)] bg-surface-sunken/60 p-0.5"
      >
        {options.map((option) => {
          const active = option === value;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option)}
              className={clsx(
                "mono-label rounded-[5px] px-2.5 py-1 text-[11px] transition-colors duration-fast ease-standard",
                active ? "bg-white text-heading shadow-sm" : "text-text-muted hover:text-heading",
              )}
            >
              {LABELS[option]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
