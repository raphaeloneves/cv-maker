import { clsx } from "@/components/ui";

const LEVELS = [1, 2, 3, 4, 5] as const;

interface SkillLevelMeterProps {
  level: number;
  onChange?: (level: number) => void;
  label: string;
}

/** Evenly-spaced 1-5 level rendered as a real interactive 5-segment meter —
 * fixes the reference product's uneven 100/75/50/25/20 scale, which visually
 * collapses its bottom two levels (features/07-skills.md). Clicking a
 * segment sets the level directly. */
export function SkillLevelMeter({ level, onChange, label }: SkillLevelMeterProps) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1.5">
      {LEVELS.map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          aria-pressed={n <= level}
          aria-label={`${label}: ${n}/5`}
          onClick={() => onChange?.(n)}
          className={clsx(
            "h-2.5 w-7 rounded-pill transition-colors duration-fast",
            n <= level ? "bg-orange" : "bg-surface-sunken",
            onChange && "cursor-pointer hover:opacity-80",
          )}
        />
      ))}
    </div>
  );
}
