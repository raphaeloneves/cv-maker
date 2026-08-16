import { useEffect, useState } from "react";
import { BUILDER_STEPS, type BuilderStepKey } from "@cv-maker/contracts";
import { t } from "@/i18n";
import { getStoredLocale } from "@/lib/locale";
import { getCvId, withCvId } from "@/lib/use-cv-id";
import { clsx } from "@/components/ui";

interface BuilderStepperProps {
  /** Which of the 4 steps is current. */
  currentStep: BuilderStepKey;
  /** Current CV id, propagated as `?cvId=` on every step link (see
   * `src/lib/use-cv-id.ts`) so switching steps keeps editing the same CV.
   * Optional: since `apps/web` is a static multi-page app, an Astro page's
   * frontmatter cannot see the runtime `?cvId=` query string (there's no
   * per-request server) — when omitted, this component resolves it
   * client-side from `window.location.search` itself, so callers never need
   * to plumb it through. */
  cvId?: string;
}

/** The 4-step builder progress indicator, driven end-to-end by
 * `BUILDER_STEPS` from `@cv-maker/contracts` — route path, stepper label are
 * always derived from the same shared config, so they can never drift apart
 * (features/16). Deliberately includes "Checkout" as an honest 4th node
 * (the reference product hides payment from its stepper entirely). */
export function BuilderStepper({ currentStep, cvId }: BuilderStepperProps) {
  const [locale, setLocale] = useState(getStoredLocale());
  const [resolvedCvId, setResolvedCvId] = useState(cvId ?? "");
  useEffect(() => {
    setLocale(getStoredLocale());
    if (!cvId) {
      setResolvedCvId(getCvId() ?? "");
    }
  }, [cvId]);

  const currentIndex = BUILDER_STEPS.findIndex((s) => s.key === currentStep);

  return (
    <nav aria-label={t(locale, "builder.stepLabel").replace("{current}", String(currentIndex + 1)).replace("{total}", String(BUILDER_STEPS.length))}>
      <ol className="flex items-center justify-center gap-1 sm:gap-2">
        {BUILDER_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = step.key === currentStep;
          const href = withCvId(step.path, resolvedCvId || null);
          return (
            <li key={step.key} className="flex items-center">
              <a
                href={href}
                aria-current={isCurrent ? "step" : undefined}
                className={clsx(
                  "group flex items-center gap-2 rounded-pill px-2.5 py-1.5 sm:px-3 transition-colors duration-fast ease-standard",
                  isCurrent && "bg-orange/10",
                )}
              >
                <span
                  className={clsx(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-pill text-xs font-bold transition-colors duration-fast ease-standard",
                    isCurrent
                      ? "bg-orange text-white"
                      : isCompleted
                        ? "bg-navy-mid text-white"
                        : "bg-surface-sunken text-text-muted",
                  )}
                >
                  {isCompleted ? "✓" : index + 1}
                </span>
                <span
                  className={clsx(
                    "hidden text-sm font-semibold sm:inline",
                    isCurrent ? "text-heading" : isCompleted ? "text-body" : "text-text-muted",
                  )}
                >
                  {t(locale, `builder.step.${step.key === "personal-info" ? "personalInfo" : step.key}`)}
                </span>
              </a>
              {index < BUILDER_STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={clsx(
                    "mx-0.5 h-px w-4 shrink-0 sm:w-8",
                    isCompleted ? "bg-navy-mid" : "bg-surface-sunken",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
