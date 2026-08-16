import type { HTMLAttributes } from "react";
import { clsx } from "./clsx.js";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-lg border border-[var(--border-on-light)] bg-surface-card shadow-sm",
        className,
      )}
      {...rest}
    />
  );
}
