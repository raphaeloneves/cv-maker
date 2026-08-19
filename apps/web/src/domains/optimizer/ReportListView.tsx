import type { SVGProps } from "react";
import { useQuery } from "@tanstack/react-query";
import type { BuilderLocale, CvOptimizerReportSummary } from "@cv-maker/contracts";
import { Button, Card, clsx } from "@/components/ui";
import { t } from "@/i18n";
import { listReports } from "./api";
import { formatDate } from "./format";
import { ScoreBar } from "./ScoreBar";
import { VerdictStamp } from "./VerdictStamp";
import { reportDetailPath } from "./use-report-id";

export const REPORTS_QUERY_KEY = ["optimizer-reports"];

function icon(props: SVGProps<SVGSVGElement>) {
  return { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, ...props };
}

function JobIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...icon(props)}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}

function CvIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...icon(props)}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}

function ReportIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...icon(props)}>
      <path d="M3 3v18h18" />
      <path d="M7 15l3-3 3 2 5-6" />
    </svg>
  );
}

const STEPS = [
  { key: "step1", Icon: JobIcon },
  { key: "step2", Icon: CvIcon },
  { key: "step3", Icon: ReportIcon },
] as const;

/** A colored left accent bar carrying the pass/reject signal through a
 * card — a real positioned element, not a `border-l-*` utility layered on
 * `Card`'s own `border` shorthand (see the same reasoning in
 * ReportDetailView.tsx's `StatusAccent`, which this mirrors). */
function VerdictAccent({ verdict }: { verdict: "pass" | "reject" }) {
  return (
    <span
      className={clsx("absolute inset-y-0 left-0 w-1", verdict === "pass" ? "bg-success" : "bg-danger")}
      aria-hidden="true"
    />
  );
}

function ReportCardBody({ report, locale }: { report: CvOptimizerReportSummary; locale: BuilderLocale }) {
  if (report.status === "completed") {
    return report.objectionsScorePercent !== null ? (
      <ScoreBar score={report.objectionsScorePercent} label={t(locale, "optimizer.detail.score.label")} />
    ) : null;
  }
  if (report.status === "failed") {
    return <p className="text-xs text-danger">{report.errorMessage ?? t(locale, "common.error.generic")}</p>;
  }
  return (
    <div className="flex items-center gap-2">
      <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-orange" aria-hidden="true" />
      <p className="mono-label text-[10px] text-text-muted">{t(locale, "optimizer.card.status.processing")}</p>
    </div>
  );
}

/** One report card — a verdict-colored accent down the left edge, the role
 * and date up top, a small static (non-animated — see VerdictStamp's own
 * comment on why a grid of stamps shouldn't all animate at once) verdict
 * stamp, and the objections score as a bar rather than a ring: several
 * rings competing for space in a card grid read as busy, where a
 * fixed-width bar sits naturally in a fixed-width column. */
function ReportCard({ report, locale }: { report: CvOptimizerReportSummary; locale: BuilderLocale }) {
  const isDecided = report.status === "completed" && report.verdict !== null;
  return (
    <a href={reportDetailPath(report.id)} className="block h-full">
      <Card className="relative flex h-full flex-col justify-between gap-5 overflow-hidden py-5 pr-5 pl-6 transition-shadow duration-fast ease-standard hover:shadow-md">
        {isDecided && <VerdictAccent verdict={report.verdict as "pass" | "reject"} />}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="mono-label text-[10px] text-text-muted">{formatDate(report.createdAt, locale)}</p>
            <p className="mt-1 font-display text-base font-bold leading-snug text-heading">{report.roleTitle}</p>
          </div>
          {isDecided && <VerdictStamp verdict={report.verdict as "pass" | "reject"} locale={locale} size="sm" />}
        </div>
        <ReportCardBody report={report} locale={locale} />
      </Card>
    </a>
  );
}

/** `/optimizer`'s default ("list") state — shown whenever there's no
 * `?reportId=` in the URL. Query pattern mirrors `CvDashboard.tsx`: loading /
 * error / empty / populated states over one `useQuery`, plus a persistent
 * "New report" action linking to the `/optimizer/new` creation page (see
 * that page's own file comment for why this is a real page, not a `Modal`).
 * Cards for pending/processing reports are still clickable — the detail view
 * itself owns the polling, so there's no reason to block navigation on
 * status. */
export function ReportListView({ locale }: { locale: BuilderLocale }) {
  const reportsQuery = useQuery({ queryKey: REPORTS_QUERY_KEY, queryFn: listReports });

  return (
    <div className="mx-auto max-w-[90rem] px-5 py-10 sm:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mono-label text-xs text-orange">{t(locale, "optimizer.eyebrow")}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-heading">
            {t(locale, "optimizer.title")}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-text-muted">{t(locale, "optimizer.subtitle")}</p>
        </div>
        <Button size="lg" onClick={() => (window.location.href = "/optimizer/new")}>
          {t(locale, "optimizer.newReport")}
        </Button>
      </div>

      {reportsQuery.isLoading && (
        <p className="mono-label text-xs text-text-muted">{t(locale, "common.loading")}</p>
      )}

      {reportsQuery.isError && (
        <Card className="p-6 text-sm text-danger">{t(locale, "common.error.generic")}</Card>
      )}

      {reportsQuery.data && reportsQuery.data.length === 0 && (
        <Card className="flex flex-col items-center gap-6 p-10 text-center">
          <div>
            <h2 className="font-display text-lg font-bold text-heading">{t(locale, "optimizer.empty.title")}</h2>
            <p className="mt-1 max-w-sm text-sm text-text-muted">{t(locale, "optimizer.empty.body")}</p>
          </div>
          <ol className="flex w-full max-w-md flex-col gap-3 text-left">
            {STEPS.map(({ key, Icon }, index) => (
              <li key={key} className="flex gap-4 rounded-md border border-[var(--border-on-light)] bg-surface-sunken/40 p-4">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange/10 text-orange">
                  <Icon />
                </span>
                <div>
                  <p className="mono-label text-[10px] text-text-muted">{`0${index + 1}`}</p>
                  <p className="font-display text-sm font-bold text-heading">{t(locale, `optimizer.${key}.title`)}</p>
                  <p className="mt-0.5 text-xs text-text-muted">{t(locale, `optimizer.${key}.body`)}</p>
                </div>
              </li>
            ))}
          </ol>
          <Button size="lg" onClick={() => (window.location.href = "/optimizer/new")}>
            {t(locale, "optimizer.newReport")}
          </Button>
        </Card>
      )}

      {reportsQuery.data && reportsQuery.data.length > 0 && (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reportsQuery.data.map((report) => (
            <li key={report.id}>
              <ReportCard report={report} locale={locale} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
