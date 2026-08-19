import type { ReactNode } from "react";
import { clsx } from "./clsx.js";

interface FieldShellProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}

/** Shared label/error/hint wrapper for every form control (Input, TextArea,
 * Select, DatePicker, RichTextEditor). Keeps required-field styling and
 * error presentation consistent across the whole builder — every field that
 * fails server-side validation, not just client-only asterisks, renders the
 * same way here. */
export function FieldShell({ label, htmlFor, required, error, hint, children }: FieldShellProps) {
  return (
    // mx-2 (0.5rem each side) gives the focus ring's soft glow (ring-4,
    // extending outward from the input's own border) room to breathe
    // instead of touching the neighboring field or the container's edge —
    // without this, an inset ring on the first/last field in a row reads as
    // clipped.
    <div className="mx-2 flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-heading">
        {label}
        {required && <span className="text-orange ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && (
        <p className={clsx("text-xs text-danger")} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// Deliberately no focus styling here — Input/Select append one of
// focusRingClasses/focusRingErrorClasses below, never both, so an invalid
// field that's focused stays visibly red instead of a same-specificity
// `focus:border-orange` clobbering `border-danger`.
export const inputBaseClasses =
  "w-full rounded-md border border-[var(--border-on-light)] bg-surface-card px-3 py-2 text-sm text-body placeholder:text-text-muted transition-shadow duration-fast ease-standard focus:outline-none disabled:opacity-50";

// A thin border-color change + a soft low-opacity ring reads as "you're
// typing here," calm and on-brand — a hard 2px solid-orange outline (the
// previous global `:focus-visible` treatment) is visually indistinguishable
// from an error state on every field, focused or not, which is confusing on
// a form this size.
export const focusRingClasses = "focus:border-orange focus:ring-4 focus:ring-orange/15";
// Error stays visibly red through focus too — a field you're actively
// fixing should keep saying so, not switch to the calm "all good" color
// the moment you click into it.
export const focusRingErrorClasses = "focus:border-danger focus:ring-4 focus:ring-danger/15";
