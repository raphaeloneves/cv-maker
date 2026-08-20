import type { AcademyLessonSummary, AcademyOutline } from "@cv-maker/contracts";
import { clsx } from "@/components/ui";

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-muted">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** Completion indicator to the left of a lesson's title: an outline circle
 * when incomplete, a filled accent circle with a white check once complete
 * (matches the app's `orange` primary token — same as `Button`'s `primary`
 * variant and the completed-state look the user asked for). */
function LessonStatusDot({ completed }: { completed: boolean }) {
  return (
    <span
      className={clsx(
        "grid h-4 w-4 shrink-0 place-items-center rounded-full border",
        completed ? "border-orange bg-orange text-white" : "border-[var(--border-on-light)] bg-transparent",
      )}
    >
      {completed && <CheckIcon />}
    </span>
  );
}

function LessonRow({
  lesson,
  selected,
  onSelect,
}: {
  lesson: AcademyLessonSummary;
  selected: boolean;
  onSelect: (slug: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(lesson.slug)}
      className={clsx(
        "flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors duration-fast ease-standard",
        selected ? "bg-orange/10 font-semibold text-heading" : "text-text-muted hover:bg-surface-sunken hover:text-heading",
      )}
    >
      <span className="mt-0.5">
        <LessonStatusDot completed={lesson.completed} />
      </span>
      <span className="flex-1">{lesson.title}</span>
      {lesson.locked && (
        <span className="mt-0.5">
          <LockIcon />
        </span>
      )}
    </button>
  );
}

export function AcademySidebar({
  outline,
  selectedSlug,
  onSelect,
}: {
  outline: AcademyOutline;
  selectedSlug: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <nav aria-label="Academy lessons" className="flex flex-col gap-4 overflow-y-auto">
      <div className="flex flex-col gap-0.5">
        {outline.standaloneLessons.map((lesson) => (
          <LessonRow key={lesson.slug} lesson={lesson} selected={lesson.slug === selectedSlug} onSelect={onSelect} />
        ))}
      </div>

      {outline.groups.map((group) => (
        <div key={group.slug} className="flex flex-col gap-0.5">
          <p className="mono-label px-2.5 pb-1 text-[11px] font-bold text-orange">{group.title}</p>
          {group.lessons.map((lesson) => (
            <LessonRow key={lesson.slug} lesson={lesson} selected={lesson.slug === selectedSlug} onSelect={onSelect} />
          ))}
        </div>
      ))}
    </nav>
  );
}
