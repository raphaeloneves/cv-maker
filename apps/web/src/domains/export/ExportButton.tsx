import { useState } from "react";
import { Button } from "@/components/ui";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";
import { downloadBlob, exportCv } from "./api.js";

interface ExportButtonProps {
  cvId: string;
  cvTitle: string;
  onUpgradeClick?: () => void;
}

/** "Download PDF" action — POSTs the export, saves the returned blob, and
 * shows a clear, non-alarming notice (not a blocking error) with an upgrade
 * CTA when `X-Watermarked: true` (features/18, features/19's freemium
 * model). */
export function ExportButton({ cvId, cvTitle, onUpgradeClick }: ExportButtonProps) {
  const locale = useBuilderLocale();
  const [loading, setLoading] = useState(false);
  const [watermarkNotice, setWatermarkNotice] = useState(false);
  const [error, setError] = useState(false);

  async function handleExport() {
    setLoading(true);
    setError(false);
    try {
      const result = await exportCv(cvId);
      const filename = `${cvTitle.trim().replace(/[^\w\- ]+/g, "") || "cv"}.pdf`;
      downloadBlob(result.blob, filename);
      setWatermarkNotice(result.watermarked);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleExport} loading={loading} size="lg">
        {t(locale, "export.download")}
      </Button>
      {error && <p className="text-xs text-danger">{t(locale, "export.error")}</p>}
      {watermarkNotice && (
        <div className="flex items-center justify-between gap-3 rounded-md bg-ice px-3 py-2 text-xs text-body">
          <span>{t(locale, "export.watermarkNotice")}</span>
          {onUpgradeClick && (
            <button type="button" onClick={onUpgradeClick} className="shrink-0 font-semibold text-orange hover:underline">
              {t(locale, "export.upgradeCta")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
