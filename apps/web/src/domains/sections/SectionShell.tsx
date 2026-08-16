import { useState, type ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { resolveSectionTitle } from "@cv-maker/contracts";
import type { CvContentLanguage, Section, UpdateSection } from "@cv-maker/contracts";
import { clsx } from "@/components/ui";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";
import { DragHandleIcon, GearIcon } from "./icons.js";
import { SectionSettingsPopover } from "./SectionSettingsPopover.js";

const DATED_SECTION_TYPES = new Set(["work_experience", "education", "courses"]);

interface SectionShellProps {
  section: Section;
  contentLanguage: CvContentLanguage;
  entryCount?: number;
  onUpdate: (body: UpdateSection) => Promise<unknown>;
  onRemove?: () => Promise<unknown>;
  children: ReactNode;
}

/** Card chrome shared by every section on the content step: drag handle
 * (section-level reorder), resolved title, entry-count badge, and the
 * gear-icon settings popover. See features/15-section-management.md. */
export function SectionShell({ section, contentLanguage, entryCount, onUpdate, onRemove, children }: SectionShellProps) {
  const locale = useBuilderLocale();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const title = resolveSectionTitle(section.type, contentLanguage, section.displayName);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx(
        "rounded-lg border border-[var(--border-on-light)] bg-surface-card shadow-sm",
        isDragging && "z-10 opacity-70 shadow-xl",
        section.hidden && "opacity-60",
      )}
    >
      <header className="flex items-center gap-3 border-b border-[var(--border-on-light)] px-4 py-3">
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none text-text-muted active:cursor-grabbing"
          aria-label={t(locale, "section.dragToReorder")}
          {...attributes}
          {...listeners}
        >
          <DragHandleIcon />
        </button>
        <h3 className="min-w-0 flex-1 truncate font-display text-lg font-bold text-heading">
          {title}
          {section.hidden && (
            <span className="mono-label ml-2 align-middle text-[10px] text-text-muted">
              {t(locale, "section.hiddenBadge")}
            </span>
          )}
        </h3>
        {typeof entryCount === "number" && entryCount > 0 && (
          <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-orange/15 px-1 text-[11px] font-semibold text-orange">
            {entryCount}
          </span>
        )}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            aria-label={t(locale, "section.settings")}
            aria-expanded={settingsOpen}
            className={clsx(
              "rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-sunken",
              settingsOpen && "bg-surface-sunken text-heading",
            )}
          >
            <GearIcon />
          </button>
          {settingsOpen && (
            <SectionSettingsPopover
              section={section}
              showOrganizeChronologically={DATED_SECTION_TYPES.has(section.type)}
              onUpdate={onUpdate}
              onRemove={onRemove}
              onClose={() => setSettingsOpen(false)}
            />
          )}
        </div>
      </header>
      <div className="p-4">{children}</div>
    </div>
  );
}
