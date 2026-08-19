import { useId, type ReactNode } from "react";
import { clsx } from "./clsx.js";

interface TooltipProps {
  content: string;
  /** Custom trigger element — defaults to a small info icon. */
  children?: ReactNode;
  className?: string;
}

/** A short hover/focus-triggered explanation, anchored above its trigger.
 * Plain CSS show/hide (`group-hover`/`group-focus-within`) — no positioning
 * library, since this is always a small fixed-width panel next to a label,
 * never something needing viewport-aware placement. Use for a one/two
 * sentence clarification (e.g. "how is this number calculated"), not for
 * anything longer or interactive. */
export function Tooltip({ content, children, className }: TooltipProps) {
  const id = useId();
  return (
    <span className={clsx("group relative inline-flex", className)}>
      <button
        type="button"
        aria-describedby={id}
        className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-text-muted transition-colors duration-fast ease-standard hover:text-heading focus-visible:text-heading"
      >
        {children ?? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 16v-5" />
            <path d="M12 8h.01" />
          </svg>
        )}
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-md border border-[var(--border-on-light)] bg-navy-deep px-3 py-2 text-left text-xs font-normal leading-relaxed text-ice opacity-0 shadow-lg transition-opacity duration-fast ease-standard group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {content}
      </span>
    </span>
  );
}
