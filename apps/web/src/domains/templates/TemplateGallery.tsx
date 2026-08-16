import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TEMPLATE_DEFINITIONS, defaultColorFor } from "@cv-maker/contracts";
import type { Cv, CvRenderData, CvTemplatePreference, TemplateId } from "@cv-maker/contracts";
import { apiGet } from "@/lib/api-client";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";
import { templatesApi } from "./api.js";
import { TemplateCard } from "./TemplateCard.js";
import { TemplatePreviewModal } from "./TemplatePreviewModal.js";

/** `/builder/template` step: a card grid for the 4 `TEMPLATE_DEFINITIONS`,
 * each opening a live preview modal fed by `GET /cvs/:cvId/render-data`.
 * Remembers each template's last-picked color independently via the
 * template-preference endpoints — switching templates and back restores
 * that template's own color, never one flat CV-level color. */
export function TemplateGallery({ cvId }: { cvId: string }) {
  const locale = useBuilderLocale();
  const qc = useQueryClient();
  const [openTemplateId, setOpenTemplateId] = useState<TemplateId | null>(null);

  const cvQuery = useQuery({ queryKey: ["cv", cvId], queryFn: () => apiGet<Cv>(`/cvs/${cvId}`) });
  const renderDataQuery = useQuery({
    queryKey: ["cv-render-data", cvId],
    queryFn: () => apiGet<CvRenderData>(`/cvs/${cvId}/render-data`),
  });
  const preferencesQuery = useQuery({
    queryKey: ["template-preferences", cvId],
    queryFn: () => templatesApi.listPreferences(cvId),
  });

  function colorFor(templateId: TemplateId): string {
    const pref = preferencesQuery.data?.find((p) => p.templateId === templateId);
    return pref?.color ?? defaultColorFor(templateId);
  }

  const setColor = useMutation({
    mutationFn: ({ templateId, color }: { templateId: TemplateId; color: string }) =>
      templatesApi.setPreference(cvId, templateId, color),
    onSuccess: (pref) => {
      qc.setQueryData<CvTemplatePreference[]>(["template-preferences", cvId], (old = []) => [
        ...old.filter((p) => p.templateId !== pref.templateId),
        pref,
      ]);
    },
  });

  const selectTemplate = useMutation({
    mutationFn: (templateId: TemplateId) => templatesApi.selectTemplate(cvId, templateId),
    onSuccess: (cv) => qc.setQueryData(["cv", cvId], cv),
  });

  const selectedTemplateId = cvQuery.data?.templateId;
  const openDefinition = TEMPLATE_DEFINITIONS.find((d) => d.id === openTemplateId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-heading">{t(locale, "templates.heading")}</h2>
        <p className="mt-1 text-sm text-text-muted">{t(locale, "templates.subheading")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TEMPLATE_DEFINITIONS.map((def) => (
          <TemplateCard
            key={def.id}
            definition={def}
            selected={def.id === selectedTemplateId}
            color={colorFor(def.id)}
            onOpenPreview={() => setOpenTemplateId(def.id)}
          />
        ))}
      </div>

      {openDefinition && (
        <TemplatePreviewModal
          open
          onClose={() => setOpenTemplateId(null)}
          definition={openDefinition}
          baseRenderData={renderDataQuery.data}
          color={colorFor(openDefinition.id)}
          onColorChange={(color) => setColor.mutate({ templateId: openDefinition.id, color })}
          onConfirmSelect={() => {
            void selectTemplate.mutateAsync(openDefinition.id);
            setOpenTemplateId(null);
          }}
          selected={openDefinition.id === selectedTemplateId}
        />
      )}
    </div>
  );
}
