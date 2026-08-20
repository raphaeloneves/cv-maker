import type { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "./clsx.js";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-orange text-white hover:bg-accent-hover",
  secondary:
    "bg-transparent text-heading border border-[var(--border-on-light)] hover:bg-surface-sunken",
  ghost: "bg-transparent text-heading hover:bg-surface-sunken",
  danger: "bg-transparent text-danger border border-danger/30 hover:bg-danger/10",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2.5 gap-2",
  lg: "text-base px-6 py-3 gap-2",
};

/** Base interactive control for the whole app — every other button-like
 * component (IconButton, links styled as buttons) should compose this rather
 * than reimplementing variant/size logic. */
export function Button({
  variant = "primary",
  size = "md",
  icon,
  loading,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        // opacity-50 (not just a lighter background) so disabled reads as
        // "unavailable" at a glance — a paler orange alone still looks like
        // an inviting CTA, just a softer one. pointer-events-none belts and
        // braces the `disabled` attribute against hover states some
        // browsers still apply to a disabled control.
        "inline-flex items-center justify-center rounded-md font-semibold transition-colors duration-fast ease-standard disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
