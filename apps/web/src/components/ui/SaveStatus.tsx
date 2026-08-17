import { clsx } from "./clsx.js";
import { t } from "@/i18n";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";

export type SaveState = "idle" | "saving" | "saved" | "error";

/** Visible autosave indicator — replaces the reference product's silent
 * explicit-Save-button pattern (features/15's biggest flagged data-loss
 * risk). Every debounced-autosave mutation hook should surface one of these
 * states next to the field/section it's saving.
 *
 * Goes through save.saving/save.saved/save.error, not hardcoded English —
 * this used to render a literal "Saved" regardless of locale, which read as
 * a stray duplicate label sitting next to an already-translated "Concluído"
 * button in the pt-PT UI. */
export function SaveStatus({ state }: { state: SaveState }) {
  const locale = useBuilderLocale();
  if (state === "idle") return null;
  const label =
    state === "saving"
      ? t(locale, "save.saving")
      : state === "saved"
        ? t(locale, "save.saved")
        : t(locale, "save.error");
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
