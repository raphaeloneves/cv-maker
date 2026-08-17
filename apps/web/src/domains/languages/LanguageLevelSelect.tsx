import type { LanguageProficiency } from "@cv-maker/contracts";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";

const DESCRIPTIVE_LEVELS = ["native", "highly_proficient", "advanced", "good_working", "working"] as const;
const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

function encode(p: LanguageProficiency): string {
  return `${p.scale}:${p.level}`;
}

function decode(value: string): LanguageProficiency {
  const [scale, level] = value.split(":");
  return scale === "cefr"
    ? { scale: "cefr", level: level as (typeof CEFR_LEVELS)[number] }
    : { scale: "descriptive", level: level as (typeof DESCRIPTIVE_LEVELS)[number] };
}

/** Grouped `<optgroup>` "Descriptive" vs "CEFR" dropdown — fixes the
 * reference product's single flat 11-option list where the two proficiency
 * frameworks were indistinguishable at a glance (features/08-languages.md). */
export function LanguageLevelSelect({
  value,
  onChange,
  id,
  label,
}: {
  value: LanguageProficiency;
  onChange: (next: LanguageProficiency) => void;
  id: string;
  label: string;
}) {
  const locale = useBuilderLocale();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-heading">
        {label}
      </label>
      <select
        id={id}
        className="w-full rounded-md border border-[var(--border-on-light)] bg-surface-card px-3 py-2 text-sm text-body focus:outline-none focus:border-orange focus:ring-4 focus:ring-orange/15"
        value={encode(value)}
        onChange={(e) => onChange(decode(e.target.value))}
      >
        <optgroup label={t(locale, "languages.scale.descriptive")}>
          {DESCRIPTIVE_LEVELS.map((level) => (
            <option key={level} value={`descriptive:${level}`}>
              {t(locale, `languages.level.${level}`)}
            </option>
          ))}
        </optgroup>
        <optgroup label={t(locale, "languages.scale.cefr")}>
          {CEFR_LEVELS.map((level) => (
            <option key={level} value={`cefr:${level}`}>
              {level}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}
