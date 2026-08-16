import { SaveStatus } from "@/components/ui";
import { useDebouncedAutosave } from "@/lib/use-debounced-autosave.js";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";
import { RichTextEditor } from "@/domains/sections/RichTextEditor.js";
import { sectionsApi } from "@/domains/sections/api.js";

interface FreeformSectionProps {
  sectionId: string;
  initialDescription: string | null;
  ariaLabel: string;
  tips?: string[];
}

/** One shared implementation for every "single rich-text blob" section type
 * — profile_summary, achievements, publications, custom — bound to
 * `PATCH /sections/:sectionId/freeform` via ~1.2s debounced autosave. See
 * packages/contracts/src/sections/freeform.ts and features/04, 12, 13, 14. */
export function FreeformSection({ sectionId, initialDescription, ariaLabel, tips }: FreeformSectionProps) {
  const locale = useBuilderLocale();
  const autosave = useDebouncedAutosave(initialDescription ?? "", (html) =>
    sectionsApi.saveFreeform(sectionId, html.trim() ? html : null),
  );

  return (
    <div className="flex flex-col gap-2">
      {tips && tips.length > 0 && (
        <details className="rounded-md bg-ice/60 px-3 py-2 text-sm text-body">
          <summary className="cursor-pointer select-none font-medium text-heading">{t(locale, "tips.label")}</summary>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-xs text-text-muted">
            {tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </details>
      )}
      <RichTextEditor value={autosave.value} onChange={autosave.setValue} ariaLabel={ariaLabel} />
      <div className="self-end">
        <SaveStatus state={autosave.state} />
      </div>
    </div>
  );
}
