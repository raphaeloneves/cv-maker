import { clsx } from "./clsx.js";

export type SaveState = "idle" | "saving" | "saved" | "error";

/** Visible autosave indicator — replaces the reference product's silent
 * explicit-Save-button pattern (features/15's biggest flagged data-loss
 * risk). Every debounced-autosave mutation hook should surface one of these
 * states next to the field/section it's saving. */
export function SaveStatus({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  const label =
    state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Couldn't save. Retrying…";
  return (
    <span
      className={clsx(
        "mono-label text-[11px] transition-opacity duration-standard",
        state === "error" ? "text-danger" : "text-text-muted",
      )}
      role="status"
      aria-live="polite"
    >
      {label}
    </span>
  );
}
