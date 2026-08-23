import { useId, useState, type ReactNode } from "react";
import type { Section, UpdateSection } from "@cv-maker/contracts";
import { Button, Input, Toggle } from "@/components/ui";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";
import { useEntries } from "@/domains/sections/useEntries.js";
import { EntryFormCard } from "@/domains/sections/EntryFormCard.js";
import { SortableEntryList } from "@/domains/sections/SortableEntryList.js";
import { PlusIcon } from "@/domains/sections/icons.js";

interface ReferenceEntry {
  id: string;
  sectionId: string;
  companyName: string;
  contactPerson: string;
  phone: string | null;
  email: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface ReferenceDraft {
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
}

interface ReferenceUpsert {
  companyName: string;
  contactPerson: string;
  phone: string | null;
  email: string | null;
}

function toUpsert(draft: ReferenceDraft): ReferenceUpsert | null {
  if (!draft.companyName.trim() || !draft.contactPerson.trim()) return null;
  return {
    companyName: draft.companyName.trim(),
    contactPerson: draft.contactPerson.trim(),
    phone: draft.phone.trim() || null,
    email: draft.email.trim() || null,
  };
}

interface ReferencesSectionProps {
  section: Section;
  onUpdate: (body: UpdateSection) => Promise<unknown>;
}

/** Entries (company/contact/phone/email) plus a section-level "available
 * upon request" toggle stored in `section.settings`. The toggle controls
 * what's *rendered*, never what's *stored* — flipping it on/off must never
 * delete the underlying entries (features/10-references.md). */
export function ReferencesSection({ section, onUpdate }: ReferencesSectionProps) {
  const locale = useBuilderLocale();
  const toggleId = useId();
  const entries = useEntries<ReferenceEntry, ReferenceUpsert>("references", section.id);
  const [addingNew, setAddingNew] = useState(false);
  const sorted = entries.entries.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const ids = sorted.map((e) => e.id);
  const availableUponRequest = section.settings.showAvailableUponRequest === true;

  function renderFields(draft: ReferenceDraft, setDraft: (d: ReferenceDraft) => void): ReactNode {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={t(locale, "references.company")}
          value={draft.companyName}
          onChange={(e) => setDraft({ ...draft, companyName: e.target.value })}
          required
        />
        <Input
          label={t(locale, "references.contact")}
          value={draft.contactPerson}
          onChange={(e) => setDraft({ ...draft, contactPerson: e.target.value })}
          required
        />
        <Input
          label={t(locale, "references.phone")}
          type="tel"
          value={draft.phone}
          onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
        />
        <Input
          label={t(locale, "references.email")}
          type="email"
          value={draft.email}
          onChange={(e) => setDraft({ ...draft, email: e.target.value })}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-[var(--border-on-light)] bg-surface-sunken/40 p-3">
        <Toggle
          id={toggleId}
          checked={availableUponRequest}
          onChange={(checked) =>
            void onUpdate({ settings: { ...section.settings, showAvailableUponRequest: checked } })
          }
          label={t(locale, "references.availableUponRequestToggle")}
        />
        <p className="mt-1.5 pl-11 text-xs text-text-muted">{t(locale, "references.availableUponRequestHint")}</p>
      </div>

      {availableUponRequest && (
        <p className="rounded-md bg-ice/60 px-3 py-2 text-xs text-text-muted">
          {t(locale, "references.entriesPreservedHint")}
        </p>
      )}

      <p className="text-xs text-text-muted">{t(locale, "references.consentReminder")}</p>

      <SortableEntryList ids={ids} onReorder={(next) => entries.reorder(next)}>
        {sorted.map((entry) => (
          <EntryFormCard
            key={entry.id}
            id={entry.id}
            entry={entry}
            initialDraft={{
              companyName: entry.companyName,
              contactPerson: entry.contactPerson,
              phone: entry.phone ?? "",
              email: entry.email ?? "",
            }}
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
              <div>
                <p className="font-semibold text-heading">{e.companyName}</p>
                <p className="text-xs text-text-muted">{e.contactPerson}</p>
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
          initialDraft={{ companyName: "", contactPerson: "", phone: "", email: "" }}
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

      <Button variant="secondary" size="sm" icon={<PlusIcon />} onClick={() => setAddingNew(true)} disabled={addingNew} className="self-start">
        {t(locale, "references.add")}
      </Button>
    </div>
  );
}
