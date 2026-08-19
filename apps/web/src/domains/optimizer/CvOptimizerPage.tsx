import { useQuery } from "@tanstack/react-query";
import { hasActiveEntitlement } from "@cv-maker/contracts";
import type { AuthUser } from "@cv-maker/contracts";
import { AppQueryProvider } from "@/lib/query-client";
import { RequireAuth } from "@/domains/auth/components/RequireAuth";
import { billingApi } from "@/domains/billing/api.js";
import { t } from "@/i18n";
import { useBuilderLocale } from "@/lib/use-builder-locale";
import { useReportId } from "./use-report-id";
import { ReportListView } from "./ReportListView";
import { ReportDetailView } from "./ReportDetailView";
import { NotEntitled } from "./NotEntitled";

function OptimizerBody({ user }: { user: AuthUser }) {
  const locale = useBuilderLocale();
  const subscriptionQuery = useQuery({ queryKey: ["subscription"], queryFn: () => billingApi.getSubscription() });
  const entitled = hasActiveEntitlement(subscriptionQuery.data ?? null, user.role);
  const reportId = useReportId();

  if (subscriptionQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="mono-label text-xs text-text-muted">{t(locale, "common.loading")}</p>
      </div>
    );
  }

  if (!entitled) {
    return <NotEntitled locale={locale} />;
  }

  // `undefined` = the `?reportId=` query param hasn't resolved yet on this
  // client tick — render nothing for that one frame rather than flashing the
  // reports list right before switching to a report's detail view.
  if (reportId === undefined) {
    return null;
  }

  return reportId ? <ReportDetailView reportId={reportId} locale={locale} /> : <ReportListView locale={locale} />;
}

/** `/optimizer` — CV Optimizer: a listing of past reports, a "New report"
 * creation wizard, and a report detail view, all Pro-gated. `apps/web` is a
 * static multi-page app, so which of "list" vs. "one report's detail" this
 * renders is driven entirely by the `?reportId=` query param (see
 * `use-report-id.ts`), not client-side router state. */
export function CvOptimizerPage() {
  return (
    <AppQueryProvider>
      <RequireAuth>{(user) => <OptimizerBody user={user} />}</RequireAuth>
    </AppQueryProvider>
  );
}
