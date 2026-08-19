import type { BuilderLocale } from "@cv-maker/contracts";
import { Card } from "@/components/ui";
import { t } from "@/i18n";

/** Shared "this is a Pro feature, upgrade" gate — shown by every CV Optimizer
 * page (the hub, and the report-creation page) when the signed-in account
 * isn't entitled, with a real link to `/billing` rather than a dead end. */
export function NotEntitled({ locale }: { locale: BuilderLocale }) {
  return (
    <div className="mx-auto max-w-[90rem] px-5 py-10 sm:px-8">
      <p className="mono-label text-xs text-orange">{t(locale, "optimizer.eyebrow")}</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-heading">
        {t(locale, "optimizer.title")}
      </h1>
      <p className="mt-2 max-w-xl text-sm text-text-muted">{t(locale, "optimizer.subtitle")}</p>

      <Card className="mt-8 flex flex-col gap-3 p-6">
        <p className="text-sm font-medium text-heading">{t(locale, "optimizer.notEntitled.note")}</p>
        <a href="/billing" className="self-start text-sm font-semibold text-orange hover:text-accent-hover">
          {t(locale, "optimizer.notEntitled.cta")} →
        </a>
      </Card>
    </div>
  );
}
