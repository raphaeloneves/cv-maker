import { languageProficiencyPercent } from "@cv-maker/contracts";
import type { LanguageProficiency } from "@cv-maker/contracts";

/** Read-only percent meter driven by `languageProficiencyPercent()` — the
 * single documented mapping from either scale (descriptive or CEFR) onto one
 * comparable 0-100 continuum. See packages/contracts/src/sections/languages.ts. */
export function LanguageLevelMeter({ proficiency, label }: { proficiency: LanguageProficiency; label: string }) {
  const percent = languageProficiencyPercent(proficiency);
  return (
    <div className="flex min-w-[100px] items-center gap-2" role="img" aria-label={`${label}: ${percent}%`}>
      <div className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-sunken">
        <div className="h-full rounded-pill bg-orange transition-[width] duration-standard" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
