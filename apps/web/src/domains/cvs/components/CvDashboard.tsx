import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Cv } from "@cv-maker/contracts";
import { Button, Card, clsx, inputBaseClasses, focusRingClasses } from "@/components/ui";
import { t } from "@/i18n";
import { getStoredLocale } from "@/lib/locale";
import { AppQueryProvider } from "@/lib/query-client";
import { withCvId } from "@/lib/use-cv-id";
import { useConfirmDialog } from "@/lib/use-confirm-dialog";
import { RequireAuth } from "@/domains/auth/components/RequireAuth";
import { listCvs, createCv, deleteCv } from "@/domains/cvs/api";
import { DownloadCvButton } from "./DownloadCvButton.js";
import { CvTitleEditor } from "./CvTitleEditor.js";

function formatUpdated(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === "pt-PT" ? "pt-PT" : "en-GB", {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function DashboardBody() {
  const locale = getStoredLocale();
  const queryClient = useQueryClient();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const cvsQuery = useQuery({ queryKey: ["cvs"], queryFn: listCvs });

  const [filterQuery, setFilterQuery] = useState("");
  const trimmedFilterQuery = filterQuery.trim();
  const filteredCvs = useMemo(() => {
    if (!cvsQuery.data) return cvsQuery.data;
    if (!trimmedFilterQuery) return cvsQuery.data;
    const needle = trimmedFilterQuery.toLowerCase();
    return cvsQuery.data.filter((cv) => cv.title.toLowerCase().includes(needle));
  }, [cvsQuery.data, trimmedFilterQuery]);

  const createMutation = useMutation({
    mutationFn: () => createCv(),
    onSuccess: (cv) => {
      window.location.href = withCvId("/builder/personal-info", cv.id);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (cvId: string) => deleteCv(cvId),
    onSuccess: (_data, cvId) => {
      queryClient.setQueryData<Cv[]>(["cvs"], (prev) => prev?.filter((cv) => cv.id !== cvId) ?? []);
    },
  });

  return (
    <div className="mx-auto max-w-[90rem] px-5 py-10 sm:px-8">
      {confirmDialog}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-heading">
            {t(locale, "dashboard.title")}
          </h1>
          <p className="mt-1 text-sm text-text-muted">{t(locale, "dashboard.subtitle")}</p>
        </div>
        <Button
          onClick={() => createMutation.mutate()}
          loading={createMutation.isPending}
          size="lg"
        >
          {createMutation.isPending ? t(locale, "dashboard.creating") : t(locale, "dashboard.newCv")}
        </Button>
      </div>

      {cvsQuery.data && cvsQuery.data.length > 0 && (
        <div className="mb-6">
          <input
            type="search"
            value={filterQuery}
            onChange={(event) => setFilterQuery(event.target.value)}
            placeholder={t(locale, "dashboard.filter.placeholder")}
            aria-label={t(locale, "dashboard.filter.label")}
            className={clsx(inputBaseClasses, focusRingClasses, "max-w-sm")}
          />
        </div>
      )}

      {cvsQuery.isLoading && (
        <p className="mono-label text-xs text-text-muted">{t(locale, "dashboard.loading")}</p>
      )}

      {cvsQuery.isError && (
        <Card className="p-6 text-sm text-danger">{t(locale, "common.error.generic")}</Card>
      )}

      {cvsQuery.data && cvsQuery.data.length === 0 && (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <h2 className="font-display text-lg font-bold text-heading">
            {t(locale, "dashboard.empty.title")}
          </h2>
          <p className="max-w-sm text-sm text-text-muted">{t(locale, "dashboard.empty.body")}</p>
          <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending} className="mt-2">
            {t(locale, "dashboard.newCv")}
          </Button>
        </Card>
      )}

      {cvsQuery.data && cvsQuery.data.length > 0 && filteredCvs && filteredCvs.length === 0 && (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <h2 className="font-display text-lg font-bold text-heading">
            {t(locale, "dashboard.filter.empty.title").replace("{query}", trimmedFilterQuery)}
          </h2>
          <p className="max-w-sm text-sm text-text-muted">{t(locale, "dashboard.filter.empty.body")}</p>
          <Button variant="secondary" onClick={() => setFilterQuery("")} className="mt-2">
            {t(locale, "dashboard.filter.clear")}
          </Button>
        </Card>
      )}

      {filteredCvs && filteredCvs.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCvs.map((cv) => (
            <li key={cv.id}>
              <Card className="flex h-full flex-col justify-between gap-4 p-5">
                <div>
                  <p className="mono-label text-[10px] text-orange">{cv.contentLanguage} · {cv.templateId}</p>
                  <CvTitleEditor cvId={cv.id} title={cv.title} locale={locale} />
                  <p className="mt-1 text-xs text-text-muted">
                    {t(locale, "dashboard.card.updated").replace("{date}", formatUpdated(cv.updatedAt, locale))}
                  </p>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div className="flex flex-col items-start gap-2">
                    <a
                      href={withCvId("/builder/personal-info", cv.id)}
                      className="text-sm font-semibold text-orange hover:text-accent-hover"
                    >
                      {t(locale, "dashboard.card.continue")} →
                    </a>
                    <DownloadCvButton cvId={cv.id} cvTitle={cv.title} locale={locale} />
                  </div>
                  <button
                    type="button"
                    className={clsx(
                      "text-xs font-medium text-text-muted transition-colors duration-fast hover:text-danger",
                      deleteMutation.isPending && deleteMutation.variables === cv.id && "opacity-50",
                    )}
                    onClick={async () => {
                      if (await confirm({ message: t(locale, "dashboard.card.deleteConfirm"), destructive: true })) {
                        deleteMutation.mutate(cv.id);
                      }
                    }}
                  >
                    {t(locale, "dashboard.card.delete")}
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CvDashboard() {
  return (
    <AppQueryProvider>
      <RequireAuth>{() => <DashboardBody />}</RequireAuth>
    </AppQueryProvider>
  );
}
