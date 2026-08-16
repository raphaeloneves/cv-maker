import { useState, type ReactNode } from "react";
import type { Section } from "@cv-maker/contracts";
import { Button, Input } from "@/components/ui";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";
import { useEntries } from "@/domains/sections/useEntries.js";
import { EntryFormCard } from "@/domains/sections/EntryFormCard.js";
import { SortableEntryList } from "@/domains/sections/SortableEntryList.js";
import { PlusIcon } from "@/domains/sections/icons.js";

interface HobbyEntry {
  id: string;
  sectionId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface HobbyDraft {
  name: string;
}

function toUpsert(draft: HobbyDraft): { name: string } | null {
  if (!draft.name.trim()) return null;
  return { name: draft.name.trim() };
}

/** Simple repeatable single-field chip list — deliberately one hobby per
 * entry, not one comma-separated textarea, so each is independently
 * reorderable/deletable (features/09-hobbies-interests.md). Saved entries
 * render as compact pill chips rather than a bulky per-entry card. */
export function HobbiesSection({ section }: { section: Section }) {
  const locale = useBuilderLocale();
  const entries = useEntries<HobbyEntry, { name: string }>("hobbies", section.id);
  const [addingNew, setAddingNew] = useState(false);
  const sorted = entries.entries.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const ids = sorted.map((e) => e.id);

  function renderFields(draft: HobbyDraft, setDraft: (d: HobbyDraft) => void): ReactNode {
    return (
      <Input
        label={t(locale, "hobbies.name")}
        placeholder={t(locale, "hobbies.namePlaceholder")}
        value={draft.name}
        onChange={(e) => setDraft({ name: e.target.value })}
        required
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <SortableEntryList ids={ids} onReorder={(next) => entries.reorder(next)} className="flex flex-row flex-wrap gap-2">
        {sorted.map((entry) => (
          <EntryFormCard
            key={entry.id}
            id={entry.id}
            entry={entry}
            initialDraft={{ name: entry.name }}
            toUpsert={toUpsert}
            create={(body) => entries.create(body)}
            update={(id, body) => entries.update({ id, body })}
            remove={(id) => entries.remove(id)}
            editLabel={t(locale, "entry.edit")}
            deleteLabel={t(locale, "entry.delete")}
            doneLabel={t(locale, "entry.done")}
            deleteConfirmMessage={t(locale, "entry.deleteConfirm")}
            renderFields={renderFields}
            renderSummary={(e) => (
              <span className="inline-flex items-center rounded-pill bg-surface-sunken px-3 py-1.5 text-sm font-medium text-heading">
                {e.name}
              </span>
            )}
            onDeleted={() => {}}
          />
        ))}
      </SortableEntryList>

      {addingNew && (
        <div className="max-w-xs">
          <EntryFormCard
            id="__new__"
            entry={null}
            initialDraft={{ name: "" }}
            toUpsert={toUpsert}
            create={(body) => entries.create(body)}
            update={(id, body) => entries.update({ id, body })}
            remove={(id) => entries.remove(id)}
            draggable={false}
            startExpanded
            editLabel={t(locale, "entry.edit")}
            deleteLabel={t(locale, "entry.delete")}
            doneLabel={t(locale, "entry.done")}
            deleteConfirmMessage={t(locale, "entry.deleteConfirm")}
            renderFields={renderFields}
            renderSummary={() => null}
            onPersisted={() => setAddingNew(false)}
            onDeleted={() => setAddingNew(false)}
          />
        </div>
      )}

      <Button
        variant="secondary"
        size="sm"
        icon={<PlusIcon />}
        onClick={() => setAddingNew(true)}
        disabled={addingNew}
        className="self-start"
      >
        {t(locale, "hobbies.add")}
      </Button>
    </div>
  );
}
