import type { ReactNode, SelectHTMLAttributes } from "react";
import { FieldShell, inputBaseClasses } from "./FieldShell.js";
import { clsx } from "./clsx.js";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}

export function Select({ label, error, hint, id, className, children, ...rest }: SelectProps) {
  return (
    <FieldShell label={label} htmlFor={id!} required={rest.required} error={error} hint={hint}>
      <select
        id={id}
        className={clsx(inputBaseClasses, "appearance-none", error && "border-danger", className)}
        aria-invalid={!!error || undefined}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}
