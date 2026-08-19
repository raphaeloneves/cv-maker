import type { BuilderLocale, CvOptimizerVerdict } from "@cv-maker/contracts";
import { clsx } from "@/components/ui";
import { t } from "@/i18n";
import { CheckIcon, XIcon } from "@/domains/sections/icons.js";

interface VerdictStampProps {
  verdict: CvOptimizerVerdict;
  locale: BuilderLocale;
  /** `lg` (default) is the report detail page's hero centerpiece; `sm` is
   * sized for a report-list card, where several stamps sit in a grid at
   * once. */
  size?: "lg" | "sm";
  /** Play the one-shot "stamped down" entrance (`stamp-in` in global.css).
   * Reserved for the single hero stamp on the detail page — a grid of list
   * cards animating in unison would read as busy rather than deliberate,
   * so cards get the same rotated resting pose as a plain static class
   * instead (see the non-animated branch below). */
  animate?: boolean;
}

/** A double-ruled ink-stamp treatment for the pass/reject verdict, like a
 * real hiring panel just stamped the file — used on both the report detail
 * page (its one signature moment) and the report list's cards (so the
 * verdict reads at a glance across the whole list, not just once you open
 * a report). */
export function VerdictStamp({ verdict, locale, size = "lg", animate = false }: VerdictStampProps) {
  const isPass = verdict === "pass";
  const colorClass = isPass ? "border-success text-success" : "border-danger text-danger";
  const isSmall = size === "sm";
  const iconSize = isSmall ? 14 : 26;

  return (
    <div
      data-animate={animate ? "stamp" : undefined}
      className={clsx(
        "inline-block shrink-0 rounded-sm",
        isSmall ? "border-2 p-0.5" : "border-4 p-1.5",
        !animate && "-rotate-6",
        colorClass,
      )}
    >
      <div
        className={clsx(
          "flex items-center gap-2 rounded-[3px]",
          isSmall ? "border px-2.5 py-1" : "border-2 px-5 py-2",
          colorClass,
        )}
      >
        {isPass ? <CheckIcon width={iconSize} height={iconSize} /> : <XIcon width={iconSize} height={iconSize} />}
        <span
          className={clsx(
            "font-display font-extrabold uppercase tracking-widest",
            isSmall ? "text-[11px]" : "text-2xl",
          )}
        >
          {t(locale, `optimizer.detail.verdict.${verdict}`)}
        </span>
      </div>
    </div>
  );
}
