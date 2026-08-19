import { useState } from "react";
import type { BuilderLocale } from "@cv-maker/contracts";
import { clsx } from "@/components/ui";
import { t } from "@/i18n";
import { downloadBlob, exportCv } from "@/domains/export/api.js";

interface DownloadCvButtonProps {
  cvId: string;
  cvTitle: string;
  locale: BuilderLocale;
}

/** Compact "Download PDF" action for a dashboard CV card — the same
 * `POST /cvs/:id/export` the Checkout step's full-size `<ExportButton>`
 * uses, so a CV that's already finished can be re-downloaded straight from
 * the dashboard without stepping back through the whole builder. Renders
 * inline with "Continue editing"/"Delete" rather than pulling in
 * `<ExportButton>`'s larger card/notice chrome, which doesn't fit this
 * compact row. */
export function DownloadCvButton({ cvId, cvTitle, locale }: DownloadCvButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleDownload() {
    setLoading(true);
    setError(false);
    try {
      const result = await exportCv(cvId);
      const filename = `${cvTitle.trim().replace(/[^\w\- ]+/g, "") || "cv"}.pdf`;
      downloadBlob(result.blob, filename);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className={clsx(
          "text-sm font-semibold text-text-muted transition-colors duration-fast hover:text-heading",
          loading && "opacity-50",
        )}
      >
        {loading ? t(locale, "dashboard.card.downloading") : t(locale, "dashboard.card.download")}
      </button>
      {error && <p className="text-xs text-danger">{t(locale, "export.error")}</p>}
    </div>
  );
}
