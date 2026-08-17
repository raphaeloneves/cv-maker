import { useState, type SVGProps } from "react";
import { Button, Modal } from "@/components/ui";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";

const STORAGE_KEY = "cvmaker.aiUpsellSeen";

/** Shown once (ever, per browser) rather than every time a visitor confirms
 * a template — a genuine one-time teaser, not a recurring nag. */
export function hasSeenAiUpsell(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markAiUpsellSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Storage unavailable (private mode, etc) — non-critical, just means
    // the teaser may show again next time. Never block on it.
  }
}

function TargetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </svg>
  );
}

function SparkleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M12 8a4 4 0 0 0 4 4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0 4-4Z" />
    </svg>
  );
}

interface AiUpsellModalProps {
  open: boolean;
  onClose: () => void;
}

/** A one-time, fully skippable interstitial shown right after a visitor
 * confirms a template selection — the moment they've just made a creative
 * decision about their CV is a natural, low-pressure place to mention the
 * two Pro AI features on the roadmap (job-match evaluation, AI-assisted
 * content enhancement). Pure UX/marketing: no AI is actually called from
 * here, and "not now" always reaches checkout/download unobstructed. */
export function AiUpsellModal({ open, onClose }: AiUpsellModalProps) {
  const locale = useBuilderLocale();
  const [notified, setNotified] = useState(false);

  function handleNotify() {
    setNotified(true);
  }

  function handleClose() {
    markAiUpsellSeen();
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title={t(locale, "aiUpsell.title")}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">{t(locale, "aiUpsell.subtitle")}</p>

        <div className="flex flex-col gap-3">
          <div className="flex gap-3 rounded-md border border-[var(--border-on-light)] bg-surface-sunken p-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange/10 text-orange">
              <TargetIcon />
            </span>
            <div>
              <p className="font-display text-sm font-bold text-heading">{t(locale, "aiUpsell.feature.evaluate.title")}</p>
              <p className="mt-0.5 text-sm text-text-muted">{t(locale, "aiUpsell.feature.evaluate.body")}</p>
            </div>
          </div>

          <div className="flex gap-3 rounded-md border border-[var(--border-on-light)] bg-surface-sunken p-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange/10 text-orange">
              <SparkleIcon />
            </span>
            <div>
              <p className="font-display text-sm font-bold text-heading">{t(locale, "aiUpsell.feature.enhance.title")}</p>
              <p className="mt-0.5 text-sm text-text-muted">{t(locale, "aiUpsell.feature.enhance.body")}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-text-muted">{t(locale, "aiUpsell.notYet")}</p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button onClick={handleClose} size="lg">
            {t(locale, "aiUpsell.cta.dismiss")}
          </Button>
          <Button
            onClick={handleNotify}
            variant="secondary"
            size="lg"
            disabled={notified}
          >
            {notified ? t(locale, "aiUpsell.cta.notified") : t(locale, "aiUpsell.cta.notify")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
