import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { computePanelScorePercent, isEligibleForCvRewrite } from "@cv-maker/contracts";
import type {
  BuilderLocale,
  CvOptimizerObjection,
  CvOptimizerObjectionKey,
  CvOptimizerObjectionStatus,
  CvOptimizerPanelScore,
  CvOptimizerPriorityAction,
  CvOptimizerReport,
  CvOptimizerReportContent,
} from "@cv-maker/contracts";
import { Button, Card, clsx } from "@/components/ui";
import { t } from "@/i18n";
import { withCvId } from "@/lib/use-cv-id";
import { CheckIcon, WarningIcon, XIcon } from "@/domains/sections/icons.js";
import { createRewrite, getReport } from "./api";
import { RotatingMessages } from "./RotatingMessages";
import { ScoreGauge } from "./ScoreGauge";
import { VerdictStamp } from "./VerdictStamp";

const GENERATING_MESSAGE_KEYS = [1, 2, 3, 4, 5, 6].map((n) => `optimizer.detail.generating.message${n}`);
const REWRITE_MESSAGE_KEYS = [1, 2, 3, 4, 5].map((n) => `optimizer.detail.rewrite.generating.message${n}`);

/** Poll cadence while a report is still generating — frequent enough to feel
 * live, calm enough not to hammer the API for something that takes up to a
 * couple of minutes. */
const POLL_INTERVAL_MS = 4000;

const OBJECTION_ORDER: CvOptimizerObjectionKey[] = [
  "wasting_time",
  "raise_or_lower_standard",
  "understand_business",
  "story_coherent",
  "signal_or_noise",
  "right_scale",
];

const CHECKPOINTS = ["intro", "firstBullets", "progression", "scaleClarity"] as const;

const STATUS_ICON: Record<CvOptimizerObjectionStatus, typeof CheckIcon> = {
  pass: CheckIcon,
  partial: WarningIcon,
  reject: XIcon,
};
const STATUS_TEXT_CLASS: Record<CvOptimizerObjectionStatus, string> = {
  pass: "text-success",
  partial: "text-orange",
  reject: "text-danger",
};
const STATUS_BG_CLASS: Record<CvOptimizerObjectionStatus, string> = {
  pass: "bg-success/10",
  partial: "bg-orange/10",
  reject: "bg-danger/10",
};
const STATUS_ACCENT_CLASS: Record<CvOptimizerObjectionStatus, string> = {
  pass: "bg-success",
  partial: "bg-orange",
  reject: "bg-danger",
};

/** A colored left accent bar carrying the pass/partial/reject signal through
 * a card — a real positioned element, not a `border-l-*` utility layered on
 * top of `Card`'s own `border` shorthand: those are two separate Tailwind
 * utilities that both resolve to the browser's `border-left-width`/`-color`
 * properties, and which one wins depends on Tailwind's internal utility
 * generation order, not on the order they're written in `className` — an
 * easy way to end up with a card that quietly has no accent at all. */
function StatusAccent({ status }: { status: CvOptimizerObjectionStatus }) {
  return <span className={clsx("absolute inset-y-0 left-0 w-1", STATUS_ACCENT_CLASS[status])} aria-hidden="true" />;
}

function StatusBadge({ status, locale }: { status: CvOptimizerObjectionStatus; locale: BuilderLocale }) {
  const Icon = STATUS_ICON[status];
  return (
    <span
      className={clsx(
        "mono-label inline-flex shrink-0 items-center gap-1 rounded-pill px-2 py-1 text-[10px]",
        STATUS_BG_CLASS[status],
        STATUS_TEXT_CLASS[status],
      )}
    >
      <Icon width={12} height={12} className="shrink-0" />
      {t(locale, `optimizer.detail.status.${status}`)}
    </span>
  );
}

function SectionHeading({ heading, subheading }: { heading: string; subheading?: string }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-extrabold tracking-tight text-heading">{heading}</h2>
      {subheading && <p className="mt-1 max-w-2xl text-sm text-text-muted">{subheading}</p>}
    </div>
  );
}

function VerdictHero({ content, locale }: { content: CvOptimizerReportContent; locale: BuilderLocale }) {
  const score = computePanelScorePercent(content.panelScores);
  const isPass = content.verdict === "pass";
  return (
    <Card
      className={clsx(
        "flex flex-col gap-6 p-8",
        isPass ? "bg-success/5" : "bg-danger/5",
      )}
    >
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
        <p
          className={clsx(
            "flex-1 border-l-2 pl-4 text-lg font-medium leading-snug text-heading",
            isPass ? "border-l-success/40" : "border-l-danger/40",
          )}
        >
          {content.verdictReasoning}
        </p>
        {/* Stamp above the gauge, as one centered two-row unit — not spread
            out across the card's full width next to the text. */}
        <div className="flex shrink-0 flex-col items-center gap-3">
          <VerdictStamp verdict={content.verdict} locale={locale} animate />
          <ScoreGauge
            score={score}
            label={t(locale, "optimizer.detail.score.label")}
            tooltip={t(locale, "optimizer.detail.score.explanation")}
          />
        </div>
      </div>
      <PanelBreakdown panelScores={content.panelScores} locale={locale} />
    </Card>
  );
}

/** Each of the three panelists' own independent 0-100 read, laid out below
 * the combined gauge above — the whole point of asking them separately (see
 * computePanelScorePercent's own doc comment) is lost if only the blended
 * number ever reaches the page. A split panel should be visibly a split
 * panel, not just a slightly lower gauge. */
function PanelBreakdown({ panelScores, locale }: { panelScores: CvOptimizerPanelScore[]; locale: BuilderLocale }) {
  return (
    <div className="grid gap-3 border-t border-[var(--border-on-light)] pt-6 sm:grid-cols-3">
      {panelScores.map((p) => (
        <div key={p.role} className="rounded-md border border-[var(--border-on-light)] bg-surface-card p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-heading">{t(locale, `optimizer.detail.panel.${p.role}`)}</p>
            <p className="font-display text-lg font-bold text-heading">{p.score}</p>
          </div>
          <p className="mt-1 text-xs text-text-muted">{p.rationale}</p>
        </div>
      ))}
    </div>
  );
}

function SectionNav({ locale }: { locale: BuilderLocale }) {
  const items = [
    { href: "#objections", label: t(locale, "optimizer.detail.nav.objections") },
    { href: "#framework", label: t(locale, "optimizer.detail.nav.framework") },
    { href: "#gaps-strengths", label: t(locale, "optimizer.detail.nav.gaps") },
    { href: "#actions", label: t(locale, "optimizer.detail.nav.actions") },
    { href: "#verdict", label: t(locale, "optimizer.detail.nav.verdict") },
  ];
  return (
    <nav
      className="sticky top-16 z-10 -mx-5 flex flex-wrap gap-x-5 gap-y-1 border-b border-[var(--border-on-light)] bg-surface-page/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8"
      aria-label="Report sections"
    >
      {items.map((item) => (
        <a key={item.href} href={item.href} className="mono-label text-[11px] text-text-muted hover:text-heading">
          {item.label}
        </a>
      ))}
    </nav>
  );
}

function ObjectionsScorecard({ objections, locale }: { objections: CvOptimizerObjection[]; locale: BuilderLocale }) {
  const ordered = OBJECTION_ORDER.map((key) => objections.find((o) => o.key === key)).filter(
    (o): o is CvOptimizerObjection => Boolean(o),
  );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ordered.map((o) => {
        const Icon = STATUS_ICON[o.status];
        return (
          <a
            key={o.key}
            href={`#objection-${o.key}`}
            className="relative flex items-start gap-3 overflow-hidden rounded-md border border-[var(--border-on-light)] bg-surface-card py-4 pr-4 pl-5 transition-colors duration-fast ease-standard hover:bg-surface-sunken"
          >
            <StatusAccent status={o.status} />
            <span
              className={clsx(
                "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full",
                STATUS_BG_CLASS[o.status],
                STATUS_TEXT_CLASS[o.status],
              )}
            >
              <Icon width={16} height={16} />
            </span>
            <div>
              <p className="text-sm font-semibold text-heading">{t(locale, `optimizer.detail.objection.${o.key}`)}</p>
              <p className="mt-0.5 text-xs text-text-muted">{o.summary}</p>
            </div>
          </a>
        );
      })}
    </div>
  );
}

function ObjectionDetail({
  objection,
  index,
  locale,
}: {
  objection: CvOptimizerObjection;
  index: number;
  locale: BuilderLocale;
}) {
  return (
    <Card id={`objection-${objection.key}`} className="relative scroll-mt-32 overflow-hidden py-5 pr-5 pl-6">
      <StatusAccent status={objection.status} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mono-label mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-sunken text-[11px] text-text-muted">
            {index + 1}
          </span>
          <p className="font-display text-base font-bold text-heading">
            {t(locale, `optimizer.detail.objection.${objection.key}`)}
          </p>
        </div>
        <StatusBadge status={objection.status} locale={locale} />
      </div>

      <p className="mt-3 text-sm text-body">{objection.analysis}</p>

      {objection.examples.length > 0 && (
        <div className="mt-4">
          <p className="mono-label text-[10px] text-text-muted">{t(locale, "optimizer.detail.objection.examplesLabel")}</p>
          <ul className="mt-2 flex flex-col gap-2">
            {objection.examples.map((example, i) => (
              <li key={i} className="border-l-2 border-[var(--border-on-light)] pl-3 text-sm italic text-text-muted">
                “{example}”
              </li>
            ))}
          </ul>
        </div>
      )}

      {objection.actionItems.length > 0 && (
        <div className="mt-4">
          <p className="mono-label text-[10px] text-text-muted">{t(locale, "optimizer.detail.objection.actionsLabel")}</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {objection.actionItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-body">
                <CheckIcon width={14} height={14} className="mt-0.5 shrink-0 text-orange" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function FrameworkSection({
  framework,
  locale,
}: {
  framework: CvOptimizerReportContent["framework"];
  locale: BuilderLocale;
}) {
  const fundamentals = [
    { key: "ratUsage", body: framework.ratUsage },
    { key: "actionVerbsOwnership", body: framework.actionVerbsOwnership },
    { key: "structureOrganization", body: framework.structureOrganization },
  ] as const;
  const checkpointBody: Record<(typeof CHECKPOINTS)[number], string> = {
    intro: framework.checkpointIntro,
    firstBullets: framework.checkpointFirstBullets,
    progression: framework.checkpointProgression,
    scaleClarity: framework.checkpointScaleClarity,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {fundamentals.map((f) => (
          <Card key={f.key} className="p-4">
            <p className="mono-label text-[10px] text-text-muted">{t(locale, `optimizer.detail.framework.${f.key}`)}</p>
            <p className="mt-2 text-sm text-body">{f.body}</p>
          </Card>
        ))}
      </div>

      <div>
        <p className="mono-label text-[10px] text-text-muted">{t(locale, "optimizer.detail.framework.checkpointsLabel")}</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {CHECKPOINTS.map((key, i) => (
            <div key={key} className="flex gap-3 rounded-md border border-[var(--border-on-light)] bg-surface-sunken/40 p-3">
              <span className="mono-label mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange/10 text-[11px] text-orange">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-heading">{t(locale, `optimizer.detail.framework.checkpoint.${key}`)}</p>
                <p className="mt-0.5 text-xs text-text-muted">{checkpointBody[key]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GapsAndStrengths({ content, locale }: { content: CvOptimizerReportContent; locale: BuilderLocale }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="bg-danger/5 p-5">
        <h3 className="mono-label text-[11px] text-danger">{t(locale, "optimizer.detail.gaps.heading")}</h3>
        <ul className="mt-3 flex flex-col gap-3">
          {content.criticalGaps.map((gap, i) => (
            <li key={i}>
              <p className="text-sm font-semibold text-heading">{gap.issue}</p>
              <p className="mt-0.5 text-xs text-text-muted">{gap.whyItMatters}</p>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="bg-success/5 p-5">
        <h3 className="mono-label text-[11px] text-success">{t(locale, "optimizer.detail.strengths.heading")}</h3>
        <ul className="mt-3 flex flex-col gap-3">
          {content.strongestElements.map((strength, i) => (
            <li key={i}>
              <p className="text-sm font-semibold text-heading">{strength.point}</p>
              <p className="mt-0.5 text-xs text-text-muted">{strength.whyItWorks}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

const IMPACT_CLASS: Record<CvOptimizerPriorityAction["impact"], string> = {
  high: "bg-orange text-white",
  medium: "bg-orange/10 text-orange",
  low: "bg-surface-sunken text-text-muted",
};

function PriorityActions({ items, locale }: { items: CvOptimizerPriorityAction[]; locale: BuilderLocale }) {
  return (
    <ol className="flex flex-col gap-3">
      {items.map((item, i) => (
        <li key={i}>
          <Card className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="mono-label mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-sunken text-[11px] text-text-muted">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-heading">{item.change}</p>
                  <p className="mt-1 text-xs text-text-muted">{item.whyItMatters}</p>
                </div>
              </div>
              <span className={clsx("mono-label shrink-0 rounded-pill px-2 py-1 text-[9px]", IMPACT_CLASS[item.impact])}>
                {t(locale, `optimizer.detail.impact.${item.impact}`)}
              </span>
            </div>
          </Card>
        </li>
      ))}
    </ol>
  );
}

/** "Generate an improved CV" — always shown, whether the report was run
 * against one of the user's own CVs or an uploaded PDF; the backend picks
 * the matching build strategy for either (see service.ts's `createRewrite`).
 * Below `isEligibleForCvRewrite`'s threshold the button stays disabled with
 * an explanation instead of disappearing — a hidden CTA reads as broken,
 * and a low score isn't always the same story: it can be a genuine
 * experience/scale mismatch for this role, or just a CV that hasn't written
 * down enough concrete detail yet for a rewrite to have anything to sharpen.
 * Either way a rewrite can't close the gap (see rewrite-llm.ts's "never
 * invent a fact"), so the honest move is to say that plainly rather than
 * offer a button that would either do nothing useful or make something up.
 * Reuses the same report row's `rewriteStatus` lifecycle the backend tracks,
 * polled by the same query as the report itself (see ReportDetailView's
 * refetchInterval). */
function RewriteCta({ report, locale }: { report: CvOptimizerReport; locale: BuilderLocale }) {
  const queryClient = useQueryClient();
  const rewriteMutation = useMutation({
    mutationFn: () => createRewrite(report.id),
    onSuccess: (updated) => {
      queryClient.setQueryData(["optimizer-report", report.id], updated);
    },
  });

  if (!report.reportContent) return null;
  const score = computePanelScorePercent(report.reportContent.panelScores);

  if (report.rewriteStatus === "pending" || report.rewriteStatus === "processing") {
    return (
      <Card className="flex items-center gap-3 p-5">
        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-orange" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-heading">{t(locale, "optimizer.detail.rewrite.generating.title")}</p>
          <RotatingMessages
            messages={REWRITE_MESSAGE_KEYS.map((key) => t(locale, key))}
            className="text-xs text-orange"
          />
          <p className="text-xs text-text-muted">{t(locale, "optimizer.detail.rewrite.generating.body")}</p>
        </div>
      </Card>
    );
  }

  if (report.rewriteStatus === "completed" && report.rewriteCvId) {
    return (
      <Card className="flex flex-wrap items-center gap-4 bg-success/5 p-5">
        <div className="flex-1">
          <p className="text-sm font-semibold text-heading">{t(locale, "optimizer.detail.rewrite.completed.title")}</p>
          <p className="mt-0.5 text-xs text-text-muted">{t(locale, "optimizer.detail.rewrite.completed.body")}</p>
        </div>
        <Button
          className="shrink-0"
          onClick={() => (window.location.href = withCvId("/builder/personal-info", report.rewriteCvId))}
        >
          {t(locale, "optimizer.detail.rewrite.completed.viewCv")}
        </Button>
      </Card>
    );
  }

  if (!isEligibleForCvRewrite(score)) {
    return (
      <Card className="flex flex-wrap items-center gap-4 p-5">
        <div className="flex-1">
          <p className="text-sm font-semibold text-heading">{t(locale, "optimizer.detail.rewrite.cta")}</p>
          <p className="mt-0.5 text-xs text-text-muted">{t(locale, "optimizer.detail.rewrite.ineligible")}</p>
        </div>
        <Button className="shrink-0" disabled>
          {t(locale, "optimizer.detail.rewrite.cta")}
        </Button>
      </Card>
    );
  }

  const failed = report.rewriteStatus === "failed";
  return (
    <Card className="flex flex-wrap items-center gap-4 p-5">
      <div className="flex-1">
        <p className="text-sm font-semibold text-heading">{t(locale, "optimizer.detail.rewrite.cta")}</p>
        <p className="mt-0.5 text-xs text-text-muted">
          {failed
            ? (report.rewriteErrorMessage ?? t(locale, "common.error.generic"))
            : t(locale, "optimizer.detail.rewrite.pitch")}
        </p>
      </div>
      <Button className="shrink-0" onClick={() => rewriteMutation.mutate()} loading={rewriteMutation.isPending}>
        {failed ? t(locale, "optimizer.detail.rewrite.failed.tryAgain") : t(locale, "optimizer.detail.rewrite.cta")}
      </Button>
    </Card>
  );
}

function CompletedReport({ report, locale }: { report: CvOptimizerReport; locale: BuilderLocale }) {
  const content = report.reportContent as CvOptimizerReportContent;
  return (
    <div className="mt-6 flex flex-col gap-8">
      <div>
        <p className="mono-label text-xs text-orange">{t(locale, "optimizer.eyebrow")}</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-heading">{report.roleTitle}</h1>
      </div>

      <VerdictHero content={content} locale={locale} />
      <RewriteCta report={report} locale={locale} />
      <SectionNav locale={locale} />

      <section id="objections" className="scroll-mt-32">
        <SectionHeading
          heading={t(locale, "optimizer.detail.objections.heading")}
          subheading={t(locale, "optimizer.detail.objections.subheading")}
        />
        <div className="mt-4">
          <ObjectionsScorecard objections={content.objections} locale={locale} />
        </div>
        <div className="mt-6 flex flex-col gap-4">
          {OBJECTION_ORDER.map((key, i) => {
            const objection = content.objections.find((o) => o.key === key);
            return objection ? <ObjectionDetail key={key} objection={objection} index={i} locale={locale} /> : null;
          })}
        </div>
      </section>

      <section id="framework" className="scroll-mt-32">
        <SectionHeading
          heading={t(locale, "optimizer.detail.framework.heading")}
          subheading={t(locale, "optimizer.detail.framework.subheading")}
        />
        <div className="mt-4">
          <FrameworkSection framework={content.framework} locale={locale} />
        </div>
      </section>

      <section id="gaps-strengths" className="scroll-mt-32">
        <GapsAndStrengths content={content} locale={locale} />
      </section>

      <section id="actions" className="scroll-mt-32">
        <SectionHeading
          heading={t(locale, "optimizer.detail.actions.heading")}
          subheading={t(locale, "optimizer.detail.actions.subheading")}
        />
        <div className="mt-4">
          <PriorityActions items={content.priorityActions} locale={locale} />
        </div>
      </section>

      <section id="verdict" className="scroll-mt-32 border-t border-[var(--border-on-light)] pt-8">
        <SectionHeading heading={t(locale, "optimizer.detail.final.heading")} />
        <p className="mt-3 whitespace-pre-line text-sm text-body">{content.finalAssessment}</p>
        <div className="mt-4 rounded-md bg-surface-sunken p-4">
          <p className="mono-label text-[10px] text-text-muted">{t(locale, "optimizer.detail.final.nextStepsLabel")}</p>
          <p className="mt-1 text-sm text-body">{content.nextSteps}</p>
        </div>
      </section>

      <div className="flex justify-center border-t border-[var(--border-on-light)] pt-8">
        <Button size="lg" onClick={() => (window.location.href = "/optimizer/new")}>
          {t(locale, "optimizer.detail.createAnother")}
        </Button>
      </div>
    </div>
  );
}

/** `/optimizer?reportId=<id>` — the report detail view. Polls `GET
 * /cv-optimizer/reports/:id` every `POLL_INTERVAL_MS` while the report is
 * still `pending`/`processing` (no queue on the backend, so this is the only
 * way to learn it finished), and stops the moment it reaches a terminal
 * status. No fake progress bar during the wait — honesty over theater,
 * matching this app's other long-running-operation copy. */
export function ReportDetailView({ reportId, locale }: { reportId: string; locale: BuilderLocale }) {
  const reportQuery = useQuery({
    queryKey: ["optimizer-report", reportId],
    queryFn: () => getReport(reportId),
    refetchInterval: (query) => {
      const active = (s: string | null | undefined) => s === "pending" || s === "processing";
      return active(query.state.data?.status) || active(query.state.data?.rewriteStatus)
        ? POLL_INTERVAL_MS
        : false;
    },
    // The generating-state copy explicitly invites the user to leave this
    // tab in the background ("leave this page open, it'll update on its
    // own") — TanStack Query pauses refetchInterval in a backgrounded tab
    // by default, which would make that promise false, so opt back in.
    // (refetchOnWindowFocus is off app-wide — see query-client.tsx — so
    // returning to the tab wouldn't otherwise catch it up either.)
    refetchIntervalInBackground: true,
  });

  const report = reportQuery.data;

  return (
    <div className="mx-auto max-w-[90rem] px-5 py-10 sm:px-8">
      <a href="/optimizer" className="mono-label text-xs text-orange hover:text-accent-hover">
        {t(locale, "optimizer.detail.back")}
      </a>

      {reportQuery.isLoading && (
        <p className="mt-6 mono-label text-xs text-text-muted">{t(locale, "common.loading")}</p>
      )}

      {reportQuery.isError && (
        <Card className="mt-6 p-6 text-sm text-danger">{t(locale, "common.error.generic")}</Card>
      )}

      {report && (report.status === "pending" || report.status === "processing") && (
        <Card className="mt-6 flex flex-col items-center gap-3 p-12 text-center">
          <h2 className="font-display text-lg font-bold text-heading">{t(locale, "optimizer.detail.generating.title")}</h2>
          <RotatingMessages
            messages={GENERATING_MESSAGE_KEYS.map((key) => t(locale, key))}
            className="text-sm font-medium text-orange"
          />
          <p className="max-w-sm text-sm text-text-muted">{t(locale, "optimizer.detail.generating.body")}</p>
        </Card>
      )}

      {report && report.status === "failed" && (
        <Card className="mt-6 flex flex-col items-start gap-3 p-8">
          <h2 className="font-display text-lg font-bold text-heading">{t(locale, "optimizer.detail.failed.title")}</h2>
          <p className="text-sm text-danger">{report.errorMessage ?? t(locale, "common.error.generic")}</p>
          <Button onClick={() => (window.location.href = "/optimizer/new")}>
            {t(locale, "optimizer.detail.failed.tryAgain")}
          </Button>
        </Card>
      )}

      {report && report.status === "completed" && report.reportContent && (
        <CompletedReport report={report} locale={locale} />
      )}
    </div>
  );
}
