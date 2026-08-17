import type { InputHTMLAttributes } from "react";
import { FieldShell, inputBaseClasses, focusRingClasses, focusRingErrorClasses } from "./FieldShell.js";
import { clsx } from "./clsx.js";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  hint?: string;
}

export function Input({ label, error, hint, id, className, ...rest }: InputProps) {
  return (
    <FieldShell label={label} htmlFor={id!} required={rest.required} error={error} hint={hint}>
      <input
        id={id}
        className={clsx(
          inputBaseClasses,
          error ? clsx("border-danger", focusRingErrorClasses) : focusRingClasses,
          className,
        )}
        aria-invalid={!!error || undefined}
        {...rest}
      />
    </FieldShell>
  );
}
