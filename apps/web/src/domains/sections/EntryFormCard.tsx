import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SaveStatus, clsx, type SaveState } from "@/components/ui";
import { useConfirmDialog } from "@/lib/use-confirm-dialog";
import { DragHandleIcon, PencilIcon, TrashIcon } from "./icons.js";

interface EntryFormCardProps<TEntry extends { id: string }, TDraft, TUpsert> {
  /** dnd-kit sortable id — the real entry id once persisted, or a stable
   * placeholder (e.g. "__new__") for a not-yet-saved entry. */
  id: string;
  entry: TEntry | null;
  initialDraft: TDraft;
  /** Returns `null` when the draft doesn't yet have enough content to
   * persist (e.g. a required field is still empty) — autosave silently
   * no-ops until this returns a real body. */
  toUpsert: (draft: TDraft) => TUpsert | null;
  create: (body: TUpsert) => Promise<TEntry>;
  update: (id: string, body: TUpsert) => Promise<TEntry>;
  remove: (id: string) => Promise<void>;
  renderFields: (draft: TDraft, setDraft: (next: TDraft) => void) => ReactNode;
  renderSummary: (entry: TEntry) => ReactNode;
  /** Fires after every successful create/update with the fresh server entry. */
  onPersisted?: (entry: TEntry, wasNewlyCreated: boolean) => void;
  /** Fires after a successful delete, or immediately for an unsaved draft's
   * delete/cancel (nothing to call the API for yet). */
  onDeleted: () => void;
  startExpanded?: boolean;
  draggable?: boolean;
  deleteConfirmMessage: string;
  editLabel: string;
  deleteLabel: string;
  doneLabel: string;
}

/** One generic "collapsible form / summary row" card used by every
 * repeatable-entry section (timeline entries, skills, languages, hobbies,
 * references). Owns the debounced-autosave lifecycle for a single entry:
 * edits are debounced (~1.2s) and POST once the draft becomes valid, then
 * PATCH on every subsequent change — so a brand-new, still-being-typed
 * entry never fires more than one create call. */
export function EntryFormCard<TEntry extends { id: string }, TDraft, TUpsert>({
  id,
  entry,
  initialDraft,
  toUpsert,
  create,
  update,
  remove,
  renderFields,
  renderSummary,
  onPersisted,
  onDeleted,
  startExpanded,
  draggable = true,
  deleteConfirmMessage,
  editLabel,
  deleteLabel,
  doneLabel,
}: EntryFormCardProps<TEntry, TDraft, TUpsert>) {
  const [expanded, setExpanded] = useState(!!startExpanded || !entry);
  const [draft, setDraft] = useState<TDraft>(initialDraft);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const savedIdRef = useRef<string | null>(entry?.id ?? null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !draggable,
  });

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  async function persist(next: TDraft) {
    const body = toUpsert(next);
    if (!body) return;
    setSaveState("saving");
    try {
      if (savedIdRef.current) {
        const saved = await update(savedIdRef.current, body);
        onPersisted?.(saved, false);
      } else {
        const saved = await create(body);
        savedIdRef.current = saved.id;
        onPersisted?.(saved, true);
      }
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  function handleChange(next: TDraft) {
    setDraft(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void persist(next), 1200);
  }

  async function handleDelete() {
    if (!(await confirm({ message: deleteConfirmMessage, destructive: true }))) return;
    if (savedIdRef.current) {
      await remove(savedIdRef.current);
    }
    onDeleted();
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx(
        "rounded-md border border-[var(--border-on-light)] bg-surface-sunken/40 p-3",
        isDragging && "opacity-70 shadow-md",
      )}
    >
      {confirmDialog}
      <div className="flex items-start gap-2">
        {draggable && (
          <button
            type="button"
            className="mt-1.5 shrink-0 cursor-grab touch-none text-text-muted active:cursor-grabbing"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <DragHandleIcon />
          </button>
        )}
        <div className="min-w-0 flex-1">
          {expanded ? (
            <div className="flex flex-col gap-3">
              {renderFields(draft, handleChange)}
              <div className="flex items-center gap-3">
                <SaveStatus state={saveState} />
                {entry && (
                  <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    className="mono-label text-[11px] text-text-muted hover:text-heading"
                  >
                    {doneLabel}
                  </button>
                )}
              </div>
            </div>
          ) : (
            entry && (
              <button type="button" className="block w-full text-left" onClick={() => setExpanded(true)}>
                {renderSummary(entry)}
              </button>
            )
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!expanded && entry && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label={editLabel}
              className="rounded p-1.5 text-text-muted hover:bg-surface-sunken"
            >
              <PencilIcon />
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            aria-label={deleteLabel}
            className="rounded p-1.5 text-danger hover:bg-danger/10"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
