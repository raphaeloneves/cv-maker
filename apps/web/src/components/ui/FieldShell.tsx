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
    <div className="flex flex-col gap-1.5">
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

export const inputBaseClasses =
  "w-full rounded-md border border-[var(--border-on-light)] bg-surface-card px-3 py-2 text-sm text-body placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-50";
