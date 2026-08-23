import { useId, useState, type ReactNode } from "react";
import type { LanguageProficiency, Section } from "@cv-maker/contracts";
import { Button, Input } from "@/components/ui";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";
import { useEntries } from "@/domains/sections/useEntries.js";
import { EntryFormCard } from "@/domains/sections/EntryFormCard.js";
import { SortableEntryList } from "@/domains/sections/SortableEntryList.js";
import { PlusIcon } from "@/domains/sections/icons.js";
import { LanguageLevelSelect } from "./LanguageLevelSelect.js";
import { LanguageLevelMeter } from "./LanguageLevelMeter.js";

interface LanguageEntry {
  id: string;
  sectionId: string;
  languageName: string;
  proficiency: LanguageProficiency;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface LanguageDraft {
  languageName: string;
  proficiency: LanguageProficiency;
}

const DEFAULT_PROFICIENCY: LanguageProficiency = { scale: "cefr", level: "B1" };

function toUpsert(draft: LanguageDraft): { languageName: string; proficiency: LanguageProficiency } | null {
  if (!draft.languageName.trim()) return null;
  return { languageName: draft.languageName.trim(), proficiency: draft.proficiency };
}

export function LanguagesSection({ section }: { section: Section }) {
  const locale = useBuilderLocale();
  const selectId = useId();
  const entries = useEntries<LanguageEntry, { languageName: string; proficiency: LanguageProficiency }>(
    "languages",
    section.id,
  );
  const [addingNew, setAddingNew] = useState(false);
  const sorted = entries.entries.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const ids = sorted.map((e) => e.id);

  function renderFields(draft: LanguageDraft, setDraft: (d: LanguageDraft) => void): ReactNode {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={t(locale, "languages.name")}
          placeholder={t(locale, "languages.namePlaceholder")}
          value={draft.languageName}
          onChange={(e) => setDraft({ ...draft, languageName: e.target.value })}
          required
        />
        <LanguageLevelSelect
          id={selectId}
          label={t(locale, "languages.level")}
          value={draft.proficiency}
          onChange={(proficiency) => setDraft({ ...draft, proficiency })}
        />
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
            initialDraft={{ languageName: entry.languageName, proficiency: entry.proficiency }}
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
                <p className="font-semibold text-heading">{e.languageName}</p>
                <LanguageLevelMeter proficiency={e.proficiency} label={t(locale, "languages.level")} />
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
          initialDraft={{ languageName: "", proficiency: DEFAULT_PROFICIENCY }}
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
        {t(locale, "languages.add")}
      </Button>
    </div>
  );
}
