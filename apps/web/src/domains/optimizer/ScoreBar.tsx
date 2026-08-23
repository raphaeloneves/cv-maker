import { useEffect, useState } from "react";
import { Tooltip, clsx } from "@/components/ui";
import { scoreColor } from "./score-color.js";

interface ScoreBarProps {
  /** 0-100. Out-of-range values are clamped rather than drawn incorrectly. */
  score: number;
  label: string;
  className?: string;
  /** Short explanation of how the number is calculated, shown via a
   * `Tooltip` next to the label. Omit in compact contexts (the report
   * list's cards) where there's no room and the detail page already
   * explains it once. */
  tooltip?: string;
}

/** Hand-rolled inline-SVG-free progress bar — no chart library, same red-to-
 * green gradient as everywhere else a score is shown (see score-color.ts).
 * Used on both the report list's cards and the detail page's relevance
 * score, so the same score always renders the same way regardless of context.
 *
 * Fills in on mount rather than just appearing at its final width: starts
 * at 0 and animates up to the real score one paint later (double
 * `requestAnimationFrame`, the standard way to guarantee the browser
 * actually painted the 0% frame before the transition has something to
 * animate from — a single rAF or a bare state-set can get batched into the
 * same frame as the initial render and skip the animation entirely).
 * Skipped for `prefers-reduced-motion`. */
export function ScoreBar({ score, label, className, tooltip }: ScoreBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const color = scoreColor(clamped);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setWidth(clamped);
      return;
    }
    setWidth(0);
    const outer = requestAnimationFrame(() => {
      const inner = requestAnimationFrame(() => setWidth(clamped));
      return () => cancelAnimationFrame(inner);
    });
    return () => cancelAnimationFrame(outer);
  }, [clamped]);

  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <div role="img" aria-label={`${label}: ${clamped} / 100`} className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2" aria-hidden="true">
          <p className="mono-label text-[10px] text-text-muted">{label}</p>
          <p className="font-display text-sm font-extrabold text-heading">{clamped}</p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-pill bg-surface-sunken">
          <div
            className="h-full rounded-pill transition-[width] duration-[700ms] ease-standard"
            style={{ width: `${width}%`, backgroundColor: color }}
          />
        </div>
      </div>
      {/* Outside the role="img" region, same reasoning as ScoreGauge's caption
          tooltip: an interactive trigger has no business living inside an
          element AT treats as a single image. */}
      {tooltip && (
        <div className="flex justify-end">
          <Tooltip content={tooltip} />
        </div>
      )}
    </div>
  );
}
