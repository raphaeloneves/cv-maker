import { Tooltip } from "@/components/ui";
import { scoreColor } from "./score-color.js";

const RADIUS = 52;
const STROKE_WIDTH = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface ScoreGaugeProps {
  /** 0-100. Out-of-range values are clamped rather than drawn incorrectly. */
  score: number;
  label: string;
  /** Rendered pixel size of the ring; defaults to a comfortable centerpiece
   * size. Pass a smaller value for compact contexts (e.g. a report card). */
  size?: number;
  /** Short explanation of how the number is calculated, shown via a
   * `Tooltip` next to the caption. Omit in compact contexts (the report
   * list's cards) where there's no room and the detail page already
   * explains it once. */
  tooltip?: string;
}

/** Hand-rolled inline-SVG radial gauge — no chart library, same reasoning as
 * the icon set in `domains/sections/icons.tsx`: this is one simple shape, not
 * a case for a dependency. A ring filled proportionally to a 0-100 score,
 * colored along a red-to-green gradient so the value reads at a glance
 * without even looking at the number, the number centered inside it. The
 * ring+number is one accessible unit (`role="img"` + `aria-label` stating the
 * score in words); the caption below it is real, visible (non-decorative)
 * text since it's the only place that label appears, with an optional
 * `Tooltip` explaining the calculation sitting outside the `role="img"`
 * region — an interactive tooltip trigger has no business living inside an
 * element a screen reader treats as a single image. */
export function ScoreGauge({ score, label, size = 128, tooltip }: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);
  const fontSize = Math.round(size * 0.22);
  const color = scoreColor(clamped);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative shrink-0"
        style={{ width: size, height: size }}
        role="img"
        aria-label={`${label}: ${clamped} / 100`}
      >
        <svg viewBox="0 0 120 120" width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--surface-sunken)" strokeWidth={STROKE_WIDTH} />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 400ms ease, stroke 400ms ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="font-display font-extrabold text-heading" style={{ fontSize }}>
            {clamped}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <p className="mono-label text-[10px] text-text-muted">{label}</p>
        {tooltip && <Tooltip content={tooltip} />}
      </div>
    </div>
  );
}
