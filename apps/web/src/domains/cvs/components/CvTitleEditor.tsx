import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BuilderLocale, Cv } from "@cv-maker/contracts";
import { clsx } from "@/components/ui";
import { t } from "@/i18n";
import { PencilIcon } from "@/domains/sections/icons.js";
import { updateCv } from "@/domains/cvs/api";

interface CvTitleEditorProps {
  cvId: string;
  title: string;
  locale: BuilderLocale;
}

/** Every new CV starts out titled "Untitled CV" (the API's default) — this
 * is the one place that title can be changed, inline on its dashboard card,
 * since the title lives on the CV shell itself rather than any builder step
 * (see `updateCv`'s existing use for `contentLanguage`, same endpoint). */
export function CvTitleEditor({ cvId, title, locale }: CvTitleEditorProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: (nextTitle: string) => updateCv(cvId, { title: nextTitle }),
    onSuccess: (cv) => {
      queryClient.setQueryData<Cv[]>(["cvs"], (prev) =>
        prev?.map((existing) => (existing.id === cvId ? cv : existing)) ?? [],
      );
    },
  });

  function startEditing() {
    setDraft(title);
    setEditing(true);
    // Focus lands after the input mounts, not before — queue it a tick out.
    requestAnimationFrame(() => inputRef.current?.select());
  }

  function commit() {
    const next = draft.trim();
    setEditing(false);
    if (next.length === 0 || next === title) return;
    mutation.mutate(next);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(title);
            setEditing(false);
          }
        }}
        maxLength={160}
        className="mt-1 w-full rounded-md border border-orange bg-surface-card px-2 py-1 font-display text-lg font-bold text-heading focus:outline-none focus:ring-4 focus:ring-orange/15"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      title={t(locale, "dashboard.card.rename")}
      className={clsx(
        "group mt-1 flex items-center gap-1.5 text-left font-display text-lg font-bold text-heading",
        mutation.isPending && "opacity-50",
      )}
    >
      {title}
      <PencilIcon className="shrink-0 text-text-muted opacity-0 transition-opacity duration-fast group-hover:opacity-100" />
    </button>
  );
}
