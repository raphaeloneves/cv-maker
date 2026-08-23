import { useState, type ReactNode } from "react";
import type { Section } from "@cv-maker/contracts";
import { Button, Input } from "@/components/ui";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";
import { useEntries } from "@/domains/sections/useEntries.js";
import { EntryFormCard } from "@/domains/sections/EntryFormCard.js";
import { SortableEntryList } from "@/domains/sections/SortableEntryList.js";
import { PlusIcon } from "@/domains/sections/icons.js";
import { SkillLevelMeter } from "./SkillLevelMeter.js";

interface SkillEntry {
  id: string;
  sectionId: string;
  name: string;
  level: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface SkillDraft {
  name: string;
  level: number;
}

function toUpsert(draft: SkillDraft): { name: string; level: number } | null {
  if (!draft.name.trim()) return null;
  return { name: draft.name.trim(), level: draft.level };
}

export function SkillsSection({ section }: { section: Section }) {
  const locale = useBuilderLocale();
  const entries = useEntries<SkillEntry, { name: string; level: number }>("skills", section.id);
  const [addingNew, setAddingNew] = useState(false);
  const sorted = entries.entries.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const ids = sorted.map((e) => e.id);

  function renderFields(draft: SkillDraft, setDraft: (d: SkillDraft) => void): ReactNode {
    return (
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Input
          label={t(locale, "skills.name")}
          placeholder={t(locale, "skills.namePlaceholder")}
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          required
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-heading">{t(locale, "skills.level")}</span>
          <SkillLevelMeter level={draft.level} onChange={(level) => setDraft({ ...draft, level })} label={t(locale, "skills.level")} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <SortableEntryList ids={ids} onReorder={(next) => entries.reorder(next)}>
        {sorted.map((entry) => (
          <EntryFormCard
            key={entry.id}
            id={entry.id}
            entry={entry}
            initialDraft={{ name: entry.name, level: entry.level }}
            toUpsert={toUpsert}
            create={(body) => entries.create(body)}
            update={(id, body) => entries.update({ id, body })}
            remove={(id) => entries.remove(id)}
            editLabel={t(locale, "entry.edit")}
            deleteLabel={t(locale, "entry.delete")}
            doneLabel={t(locale, "entry.done")}
            dragToReorderLabel={t(locale, "entry.dragToReorder")}
            deleteConfirmMessage={t(locale, "entry.deleteConfirm")}
            renderFields={renderFields}
            renderSummary={(e) => (
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-heading">{e.name}</p>
                <SkillLevelMeter level={e.level} label={t(locale, "skills.level")} />
              </div>
            )}
            onDeleted={() => {}}
          />
        ))}
      </SortableEntryList>

      {addingNew && (
        <EntryFormCard
          id="__new__"
          entry={null}
          initialDraft={{ name: "", level: 3 }}
          toUpsert={toUpsert}
          create={(body) => entries.create(body)}
          update={(id, body) => entries.update({ id, body })}
          remove={(id) => entries.remove(id)}
          draggable={false}
          startExpanded
          editLabel={t(locale, "entry.edit")}
          deleteLabel={t(locale, "entry.delete")}
          doneLabel={t(locale, "entry.done")}
          dragToReorderLabel={t(locale, "entry.dragToReorder")}
          deleteConfirmMessage={t(locale, "entry.deleteConfirm")}
          renderFields={renderFields}
          renderSummary={() => null}
          onPersisted={() => setAddingNew(false)}
          onDeleted={() => setAddingNew(false)}
        />
      )}

      <Button variant="secondary" size="sm" icon={<PlusIcon />} onClick={() => setAddingNew(true)} disabled={addingNew}>
        {t(locale, "skills.add")}
      </Button>
    </div>
  );
}
