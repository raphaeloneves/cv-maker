import { AppQueryProvider } from "@/lib/query-client.js";
import { useCvId, withCvId } from "@/lib/use-cv-id.js";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";
import { BuilderStepper } from "@/components/nav";
import { RequireAuth } from "@/domains/auth/components/RequireAuth";
import { ContentBuilder } from "./ContentBuilder.js";

function ContentBuilderPage({ cvId }: { cvId: string }) {
  const locale = useBuilderLocale();
  return (
    <div className="flex flex-col gap-6">
      <BuilderStepper currentStep="content" cvId={cvId} />
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-heading">
          {t(locale, "content.heading")}
        </h1>
        <p className="mt-1 text-sm text-text-muted">{t(locale, "content.subheading")}</p>
      </div>
      <ContentBuilder cvId={cvId} />
      <div className="mt-4 flex items-center justify-between">
        <a href={withCvId("/builder/personal-info", cvId)} className="text-sm font-medium text-text-muted hover:text-heading">
          {t(locale, "builder.back")}
        </a>
        <a
          href={withCvId("/builder/template", cvId)}
          className="inline-flex items-center rounded-md bg-orange px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          {t(locale, "builder.next")}
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

function ContentBuilderGate() {
  const cvId = useCvId();
  return cvId ? <ContentBuilderPage cvId={cvId} /> : <NoCvSelected />;
}

export function ContentBuilderIsland() {
  return (
    <AppQueryProvider>
      <RequireAuth>{() => <ContentBuilderGate />}</RequireAuth>
    </AppQueryProvider>
  );
}
