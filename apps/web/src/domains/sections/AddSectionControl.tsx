import { useState } from "react";
import { EXTRA_SECTION_TYPES, resolveSectionTitle } from "@cv-maker/contracts";
import type { CreateSection, CvContentLanguage, Section, SectionType } from "@cv-maker/contracts";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";
import { PlusIcon } from "./icons.js";

interface AddSectionControlProps {
  existingSections: Section[];
  contentLanguage: CvContentLanguage;
  onAdd: (body: CreateSection) => Promise<Section>;
}

/** "+ Add a section" control. Every add is a single idempotent, debounced
 * POST: a fresh `crypto.randomUUID()` client request id per click, and the
 * control disables itself for the duration of the request — this directly
 * fixes the reference product's confirmed duplicate-section-creation and
 * keystroke-leak defect (features/14, features/15). Languages / Courses /
 * Achievements / Publications are singleton per CV; Custom can be added any
 * number of times. */
export function AddSectionControl({ existingSections, contentLanguage, onAdd }: AddSectionControlProps) {
  const locale = useBuilderLocale();
  const [pending, setPending] = useState(false);
  const [selected, setSelected] = useState<SectionType | "">("");

  const existingTypes = new Set(existingSections.map((s) => s.type));
  const options = EXTRA_SECTION_TYPES.filter(
    (type) => type === "custom" || !existingTypes.has(type),
  );

  async function handleAdd() {
    if (pending || !selected) return;
    const type = selected;
    setPending(true);
    setSelected("");
    try {
      await onAdd({ type, clientRequestId: crypto.randomUUID() });
    } finally {
      setPending(false);
    }
  }

  if (options.length === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--border-on-light)] bg-surface-sunken/40 p-3">
      <PlusIcon className="shrink-0 text-text-muted" />
      <select
        aria-label={t(locale, "section.addExtra")}
        className="min-w-0 flex-1 rounded-md border border-[var(--border-on-light)] bg-surface-card px-3 py-2 text-sm text-body focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
        value={selected}
        disabled={pending}
        onChange={(e) => setSelected(e.target.value as SectionType)}
      >
        <option value="" disabled>
          {t(locale, "section.addExtra")}
        </option>
        {options.map((type) => (
          <option key={type} value={type}>
            {resolveSectionTitle(type, contentLanguage, null)}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleAdd}
        disabled={pending || !selected}
        className="shrink-0 rounded-md bg-orange px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-orange/50"
      >
        {pending ? t(locale, "section.adding") : t(locale, "section.add")}
      </button>
    </div>
  );
}
