import type { TemplateDefinition } from "@cv-maker/contracts";
import { clsx } from "@/components/ui";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";
import { CheckIcon } from "@/domains/sections/icons.js";
import { TemplateThumbnail } from "./TemplateThumbnail.js";

interface TemplateCardProps {
  definition: TemplateDefinition;
  selected: boolean;
  color: string;
  onOpenPreview: () => void;
}

/** Template gallery card — a genuine miniature `<CvDocument>` render (the
 * shared demo dataset, scaled down via CSS transform) tinted with the
 * template's currently-remembered accent color, so every card is an
 * accurate, distinct preview of the real design rather than an abstract
 * layout-shape approximation. */
export function TemplateCard({ definition, selected, color, onOpenPreview }: TemplateCardProps) {
  const locale = useBuilderLocale();

  return (
    <button
      type="button"
      onClick={onOpenPreview}
      className={clsx(
        "group relative flex flex-col gap-3 rounded-lg border bg-surface-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg",
        selected
          ? "border-orange ring-2 ring-orange/40"
          : definition.recommended
            ? "border-orange/40"
            : "border-[var(--border-on-light)]",
      )}
    >
      {selected && (
        <span className="absolute right-3 top-3 z-10 grid h-6 w-6 place-items-center rounded-full bg-orange text-white">
          <CheckIcon width={13} height={13} />
        </span>
      )}
      <div className="overflow-hidden rounded-md border" style={{ borderColor: `${color}40` }}>
        <TemplateThumbnail templateId={definition.id} color={color} />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-heading">{definition.name}</span>
        <div className="flex items-center gap-1.5">
          {definition.recommended && (
            <span className="mono-label rounded-pill bg-orange px-2 py-0.5 text-[10px] text-white">
              {t(locale, "templates.recommended")}
            </span>
          )}
          {definition.premium && (
            <span className="mono-label rounded-pill bg-navy-deep px-2 py-0.5 text-[10px] text-white">
              {t(locale, "templates.premium")}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
