import type { TemplateDefinition } from "@cv-maker/contracts";
import { clsx } from "@/components/ui";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";
import { CheckIcon } from "@/domains/sections/icons.js";

interface TemplateCardProps {
  definition: TemplateDefinition;
  selected: boolean;
  color: string;
  onOpenPreview: () => void;
}

/** Template gallery card — a small abstract layout-shape thumbnail (not a
 * literal screenshot, since the real render lives in the preview modal)
 * tinted with the template's currently-remembered accent color. */
export function TemplateCard({ definition, selected, color, onOpenPreview }: TemplateCardProps) {
  const locale = useBuilderLocale();
  const twoColumn = definition.layout.columns === 2;

  return (
    <button
      type="button"
      onClick={onOpenPreview}
      className={clsx(
        "group relative flex flex-col gap-3 rounded-lg border bg-surface-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg",
        selected ? "border-orange ring-2 ring-orange/40" : "border-[var(--border-on-light)]",
      )}
    >
      {selected && (
        <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-orange text-white">
          <CheckIcon width={13} height={13} />
        </span>
      )}
      <div
        className="aspect-[3/4] w-full overflow-hidden rounded-md border"
        style={{ background: `linear-gradient(160deg, ${color}1a, transparent)`, borderColor: `${color}40` }}
      >
        <div className="flex h-full gap-2 p-3">
          {definition.layout.sidebar === "left" && <div className="w-1/3 rounded" style={{ background: `${color}26` }} />}
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="h-2.5 w-2/3 rounded-sm" style={{ background: color }} />
            <div className="mt-1 h-1 w-full rounded-sm bg-navy-deep/10" />
            <div className="h-1 w-5/6 rounded-sm bg-navy-deep/10" />
            <div className="h-1 w-4/6 rounded-sm bg-navy-deep/10" />
            {twoColumn && definition.layout.sidebar === "none" && (
              <div className="mt-2 flex flex-1 gap-1.5">
                <div className="flex-1 rounded bg-navy-deep/5" />
                <div className="flex-1 rounded bg-navy-deep/5" />
              </div>
            )}
          </div>
          {definition.layout.sidebar === "right" && <div className="w-1/3 rounded" style={{ background: `${color}26` }} />}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-heading">{definition.name}</span>
        {definition.premium && (
          <span className="mono-label rounded-pill bg-navy-deep px-2 py-0.5 text-[10px] text-white">
            {t(locale, "templates.premium")}
          </span>
        )}
      </div>
    </button>
  );
}
