import { useEffect, useRef, useState } from "react";
import type { Section, UpdateSection } from "@cv-maker/contracts";
import { Toggle, SaveStatus } from "@/components/ui";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";
import { useDebouncedAutosave } from "@/lib/use-debounced-autosave.js";
import { useConfirmDialog } from "@/lib/use-confirm-dialog";

interface SectionSettingsPopoverProps {
  section: Section;
  showOrganizeChronologically: boolean;
  onUpdate: (body: UpdateSection) => Promise<unknown>;
  onRemove?: () => Promise<unknown>;
  onClose: () => void;
}

/** Gear-icon popover shared by every section — rename (`displayName`
 * override, which always wins over the locale default once set), hide,
 * force-page-break, organize-chronologically (dated sections only), and
 * remove (deletable extra sections only). See features/15. */
export function SectionSettingsPopover({
  section,
  showOrganizeChronologically,
  onUpdate,
  onRemove,
  onClose,
}: SectionSettingsPopoverProps) {
  const locale = useBuilderLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [removing, setRemoving] = useState(false);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [onClose]);

  const rename = useDebouncedAutosave(
    section.displayName ?? "",
    async (v) => onUpdate({ displayName: v.trim() ? v.trim() : null }),
  );

  async function handleRemove() {
    if (!onRemove) return;
    if (!(await confirm({ message: t(locale, "section.removeConfirm"), destructive: true }))) return;
    setRemoving(true);
    try {
      await onRemove();
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={t(locale, "section.settings")}
      className="absolute right-0 top-full z-20 mt-1.5 w-80 rounded-lg border border-[var(--border-on-light)] bg-surface-card p-4 shadow-xl"
    >
      {confirmDialog}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`rename-${section.id}`} className="text-sm font-medium text-heading">
            {t(locale, "section.rename")}
          </label>
          <input
            id={`rename-${section.id}`}
            className="w-full rounded-md border border-[var(--border-on-light)] bg-surface-card px-3 py-2 text-sm text-body focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            value={rename.value}
            onChange={(e) => rename.setValue(e.target.value)}
            placeholder={t(locale, "section.renamePlaceholder")}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-muted">{t(locale, "section.renameHint")}</p>
            <SaveStatus state={rename.state} />
          </div>
        </div>

        <Toggle
          id={`hidden-${section.id}`}
          checked={section.hidden}
          onChange={(checked) => void onUpdate({ hidden: checked })}
          label={t(locale, "section.hide")}
        />
        <p className="-mt-3 text-xs text-text-muted">{t(locale, "section.hideHint")}</p>

        <Toggle
          id={`page-break-${section.id}`}
          checked={section.forcePageBreak}
          onChange={(checked) => void onUpdate({ forcePageBreak: checked })}
          label={t(locale, "section.forcePageBreak")}
        />
        <p className="-mt-3 text-xs text-text-muted">{t(locale, "section.forcePageBreakHint")}</p>

        {showOrganizeChronologically && (
          <>
            <Toggle
              id={`chrono-${section.id}`}
              checked={section.organizeChronologically}
              onChange={(checked) => void onUpdate({ organizeChronologically: checked })}
              label={t(locale, "section.organizeChronologically")}
            />
            <p className="-mt-3 text-xs text-text-muted">{t(locale, "section.organizeChronologicallyHint")}</p>
          </>
        )}

        {section.deletable && onRemove && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="mt-1 self-start text-sm font-semibold text-danger hover:underline disabled:opacity-50"
          >
            {t(locale, "section.remove")}
          </button>
        )}
      </div>
    </div>
  );
}
