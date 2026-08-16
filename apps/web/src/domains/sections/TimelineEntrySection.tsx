import { useMemo, useState, type ReactNode } from "react";
import type { DateRange, Section } from "@cv-maker/contracts";
import { Button, Input } from "@/components/ui";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";
import { useEntries } from "./useEntries.js";
import type { EntryKind } from "./entries-api.js";
import { EntryFormCard } from "./EntryFormCard.js";
import { SortableEntryList } from "./SortableEntryList.js";
import { DateRangePicker } from "./DateRangePicker.js";
import { RichTextEditor } from "./RichTextEditor.js";
import { formatDateRange } from "./format-date-range.js";
import { PlusIcon } from "./icons.js";

/** Shared shape for every "repeatable timeline entry" section (work
 * experience / education / courses) — mirrors
 * packages/contracts/src/sections/timeline-entry.ts's `timelineEntryBaseSchema`. */
interface TimelineEntryBase {
  id: string;
  sectionId: string;
  city: string | null;
  dateRange: DateRange;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface TimelineFieldsConfig {
  primaryKey: string;
  secondaryKey: string;
  primaryLabel: string;
  secondaryLabel: string;
  primaryPlaceholder?: string;
  secondaryPlaceholder?: string;
  cityLabel: string;
  descriptionLabel: string;
  addLabel: string;
  extra?: { key: string; label: string; placeholder?: string };
}

interface TimelineDraft {
  primary: string;
  secondary: string;
  city: string;
  dateRange: DateRange;
  description: string;
  extra: string;
}

function defaultDateRange(): DateRange {
  const now = new Date();
  return {
    start: { granularity: "full", month: now.getMonth() + 1, year: now.getFullYear() },
    end: { isPresent: false, granularity: "full", month: now.getMonth() + 1, year: now.getFullYear() },
  };
}

function draftFromEntry(entry: TimelineEntryBase, fields: TimelineFieldsConfig): TimelineDraft {
  return {
    primary: String(entry[fields.primaryKey] ?? ""),
    secondary: String(entry[fields.secondaryKey] ?? ""),
    city: entry.city ?? "",
    dateRange: entry.dateRange,
    description: entry.description ?? "",
    extra: fields.extra ? String(entry[fields.extra.key] ?? "") : "",
  };
}

function emptyDraft(): TimelineDraft {
  return { primary: "", secondary: "", city: "", dateRange: defaultDateRange(), description: "", extra: "" };
}

/** Sort key for "organize chronologically": entries with a "Present" end
 * date always sort first, then by end date (most recent first), then by
 * start date as a tiebreaker. */
function chronologicalRank(range: DateRange): number {
  if (range.end.isPresent) return Number.POSITIVE_INFINITY;
  const endRank = range.end.year * 12 + (range.end.granularity === "full" ? range.end.month : 6);
  return endRank;
}

interface TimelineEntrySectionProps {
  section: Section;
  kind: EntryKind;
  fields: TimelineFieldsConfig;
}

/** Generic component behind Work Experience, Education, and Courses — same
 * timeline shape (two headline fields + city + date range + rich-text
 * description) per `timelineEntryBaseSchema`, built once and parameterized
 * three times rather than three near-identical implementations. */
export function TimelineEntrySection({ section, kind, fields }: TimelineEntrySectionProps) {
  const locale = useBuilderLocale();
  const entries = useEntries<TimelineEntryBase, Record<string, unknown>>(kind, section.id);
  const [addingNew, setAddingNew] = useState(false);

  const displayEntries = useMemo(() => {
    const list = entries.entries.slice();
    if (section.organizeChronologically) {
      list.sort((a, b) => chronologicalRank(b.dateRange) - chronologicalRank(a.dateRange));
    } else {
      list.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return list;
  }, [entries.entries, section.organizeChronologically]);

  const ids = displayEntries.map((e) => e.id);

  function toUpsert(draft: TimelineDraft): Record<string, unknown> | null {
    if (!draft.primary.trim() || !draft.secondary.trim()) return null;
    const body: Record<string, unknown> = {
      [fields.primaryKey]: draft.primary.trim(),
      [fields.secondaryKey]: draft.secondary.trim(),
      city: draft.city.trim() || null,
      dateRange: draft.dateRange,
      description: draft.description.trim() ? draft.description : null,
    };
    if (fields.extra) body[fields.extra.key] = draft.extra.trim() || null;
    return body;
  }

  function renderFields(draft: TimelineDraft, setDraft: (next: TimelineDraft) => void): ReactNode {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={fields.primaryLabel}
            value={draft.primary}
            placeholder={fields.primaryPlaceholder}
            onChange={(e) => setDraft({ ...draft, primary: e.target.value })}
            required
          />
          <Input
            label={fields.secondaryLabel}
            value={draft.secondary}
            placeholder={fields.secondaryPlaceholder}
            onChange={(e) => setDraft({ ...draft, secondary: e.target.value })}
            required
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label={fields.cityLabel} value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
          {fields.extra && (
            <Input
              label={fields.extra.label}
              value={draft.extra}
              placeholder={fields.extra.placeholder}
              onChange={(e) => setDraft({ ...draft, extra: e.target.value })}
            />
          )}
        </div>
        <DateRangePicker value={draft.dateRange} onChange={(dateRange) => setDraft({ ...draft, dateRange })} />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-heading">{fields.descriptionLabel}</label>
          <RichTextEditor
            value={draft.description}
            onChange={(html) => setDraft({ ...draft, description: html })}
            ariaLabel={fields.descriptionLabel}
          />
        </div>
      </div>
    );
  }

  function renderSummary(entry: TimelineEntryBase): ReactNode {
    const dateStr = formatDateRange(entry.dateRange, locale, t(locale, "date.present"));
    return (
      <div>
        <p className="truncate font-semibold text-heading">{String(entry[fields.primaryKey])}</p>
        <p className="text-xs text-text-muted">
          {String(entry[fields.secondaryKey])}
          {dateStr && ` · ${dateStr}`}
          {entry.city && ` · ${entry.city}`}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {section.organizeChronologically && (
        <p className="mono-label text-[10px] text-text-muted">{t(locale, "section.organizedChronologically")}</p>
      )}
      <SortableEntryList
        ids={ids}
        onReorder={(next) => entries.reorder(next)}
        disabled={section.organizeChronologically}
      >
        {displayEntries.map((entry) => (
          <EntryFormCard
            key={entry.id}
            id={entry.id}
            entry={entry}
            initialDraft={draftFromEntry(entry, fields)}
            toUpsert={toUpsert}
            create={(body) => entries.create(body)}
            update={(id, body) => entries.update({ id, body })}
            remove={(id) => entries.remove(id)}
            draggable={!section.organizeChronologically}
            editLabel={t(locale, "entry.edit")}
            deleteLabel={t(locale, "entry.delete")}
            doneLabel={t(locale, "entry.done")}
            deleteConfirmMessage={t(locale, "entry.deleteConfirm")}
            renderSummary={renderSummary}
            renderFields={renderFields}
            onDeleted={() => {}}
          />
        ))}
      </SortableEntryList>

      {addingNew && (
        <EntryFormCard
          id="__new__"
          entry={null}
          initialDraft={emptyDraft()}
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
          renderSummary={() => null}
          renderFields={renderFields}
          onPersisted={() => setAddingNew(false)}
          onDeleted={() => setAddingNew(false)}
        />
      )}

      <Button variant="secondary" size="sm" icon={<PlusIcon />} onClick={() => setAddingNew(true)} disabled={addingNew}>
        {fields.addLabel}
      </Button>
    </div>
  );
}
