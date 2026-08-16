import { AppQueryProvider } from "@/lib/query-client.js";
import { useCvId, withCvId } from "@/lib/use-cv-id.js";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";
import { BuilderStepper } from "@/components/nav";
import { RequireAuth } from "@/domains/auth/components/RequireAuth";
import { TemplateGallery } from "./TemplateGallery.js";

function TemplatePage({ cvId }: { cvId: string }) {
  const locale = useBuilderLocale();
  return (
    <div className="flex flex-col gap-6">
      <BuilderStepper currentStep="template" cvId={cvId} />
      <TemplateGallery cvId={cvId} />
      <div className="mt-4 flex items-center justify-between">
        <a href={withCvId("/builder/content", cvId)} className="text-sm font-medium text-text-muted hover:text-heading">
          {t(locale, "builder.back")}
        </a>
        <a
          href={withCvId("/builder/checkout", cvId)}
          className="inline-flex items-center rounded-md bg-orange px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          {t(locale, "templates.downloadCta")}
        </a>
      </div>
    </div>
  );
}

function NoCvSelected() {
  const locale = useBuilderLocale();
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="text-sm text-text-muted">{t(locale, "builder.noCvSelected")}</p>
      <a href="/dashboard" className="font-semibold text-orange hover:underline">
        {t(locale, "builder.startBuilding")}
      </a>
    </div>
  );
}

function TemplateGalleryGate() {
  const cvId = useCvId();
  return cvId ? <TemplatePage cvId={cvId} /> : <NoCvSelected />;
}

export function TemplateGalleryIsland() {
  return (
    <AppQueryProvider>
      <RequireAuth>{() => <TemplateGalleryGate />}</RequireAuth>
    </AppQueryProvider>
  );
}
