import { clsx } from "./clsx.js";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id: string;
  disabled?: boolean;
}

/** Used throughout section settings (hide, force page break, organize
 * chronologically, references' "available upon request") — one visual
 * language for every on/off preference in the builder. */
export function Toggle({ checked, onChange, label, id, disabled }: ToggleProps) {
  return (
    <label htmlFor={id} className="flex items-center gap-2.5 cursor-pointer select-none text-sm">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative h-5 w-9 shrink-0 rounded-pill transition-colors duration-fast ease-standard disabled:opacity-50",
          checked ? "bg-orange" : "bg-surface-sunken",
        )}
      >
        <span
          className={clsx(
            "absolute top-0.5 h-4 w-4 rounded-pill bg-white shadow transition-transform duration-fast ease-standard",
            checked ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </button>
      <span className="text-body">{label}</span>
    </label>
  );
}
