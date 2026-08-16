import { useQuery } from "@tanstack/react-query";
import type { AuthUser, Cv } from "@cv-maker/contracts";
import { apiGet } from "@/lib/api-client";
import { AppQueryProvider } from "@/lib/query-client.js";
import { useCvId, withCvId } from "@/lib/use-cv-id.js";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";
import { BuilderStepper } from "@/components/nav";
import { RequireAuth } from "@/domains/auth/components/RequireAuth";
import { CheckoutPage } from "./CheckoutPage.js";

function CheckoutPageWithCv({ cvId, user }: { cvId: string; user: AuthUser }) {
  const locale = useBuilderLocale();
  const cvQuery = useQuery({ queryKey: ["cv", cvId], queryFn: () => apiGet<Cv>(`/cvs/${cvId}`) });

  return (
    <div className="flex flex-col gap-6">
      <BuilderStepper currentStep="checkout" cvId={cvId} />
      <CheckoutPage cvId={cvId} cvTitle={cvQuery.data?.title ?? "cv"} userRole={user.role} />
      <a href={withCvId("/builder/template", cvId)} className="text-sm font-medium text-text-muted hover:text-heading">
        {t(locale, "builder.back")}
      </a>
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

function CheckoutGate({ user }: { user: AuthUser }) {
  const cvId = useCvId();
  return cvId ? <CheckoutPageWithCv cvId={cvId} user={user} /> : <NoCvSelected />;
}

export function CheckoutPageIsland() {
  return (
    <AppQueryProvider>
      <RequireAuth>{(user) => <CheckoutGate user={user} />}</RequireAuth>
    </AppQueryProvider>
  );
}
