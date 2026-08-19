import { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ACCEPTED_CV_UPLOAD_MIME_TYPES, hasActiveEntitlement, MAX_CV_UPLOAD_BYTES } from "@cv-maker/contracts";
import type {
  AuthUser,
  BuilderLocale,
  CreateCvOptimizerReportFromUploadInput,
  CreateCvOptimizerReportInput,
} from "@cv-maker/contracts";
import { Button, Card, FieldShell, Input, clsx, inputBaseClasses } from "@/components/ui";
import { focusRingClasses, focusRingErrorClasses } from "@/components/ui/FieldShell.js";
import { ApiError } from "@/lib/api-client";
import { AppQueryProvider } from "@/lib/query-client";
import { RequireAuth } from "@/domains/auth/components/RequireAuth";
import { billingApi } from "@/domains/billing/api.js";
import { t } from "@/i18n";
import { useBuilderLocale } from "@/lib/use-builder-locale";
import { CheckIcon, TrashIcon } from "@/domains/sections/icons.js";
import { listCvs } from "@/domains/cvs/api";
import { createReport, createReportFromUpload } from "./api";
import { formatDate } from "./format";
import { reportDetailPath } from "./use-report-id";
import { NotEntitled } from "./NotEntitled";

type DescriptionMode = "text" | "url";
type CvSourceMode = "existing" | "upload";

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/** Step 2's "upload a CV" dropzone — a click-or-drag file picker, not the
 * full crop/zoom editor `PhotoUploadModal` uses for photos: a CV PDF is used
 * as-is (see pdf-text.ts, which only ever extracts its plain text), so there's
 * nothing to edit, only to pick, replace, or remove. */
function CvUploadField({
  locale,
  file,
  onChange,
  error,
}: {
  locale: BuilderLocale;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function acceptFile(candidate: File) {
    setLocalError(null);
    if (!(ACCEPTED_CV_UPLOAD_MIME_TYPES as readonly string[]).includes(candidate.type)) {
      setLocalError(t(locale, "optimizer.wizard.cvUpload.error.type"));
      return;
    }
    if (candidate.size > MAX_CV_UPLOAD_BYTES) {
      setLocalError(t(locale, "optimizer.wizard.cvUpload.error.size"));
      return;
    }
    onChange(candidate);
  }

  const displayError = localError ?? error;

  if (file) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-md border border-[var(--border-on-light)] bg-surface-sunken/40 p-3">
        <div>
          <p className="font-display text-sm font-bold text-heading">{file.name}</p>
          <p className="mono-label mt-0.5 text-[10px] text-text-muted">{formatBytes(file.size)}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mono-label flex shrink-0 items-center gap-1 rounded px-2 py-1 text-[11px] text-text-muted transition-colors duration-fast ease-standard hover:text-danger"
        >
          <TrashIcon width={14} height={14} />
          {t(locale, "optimizer.wizard.cvUpload.remove")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) acceptFile(dropped);
        }}
        className={clsx(
          "flex cursor-pointer flex-col items-center gap-1 rounded-md border border-dashed p-6 text-center transition-colors duration-fast ease-standard",
          isDragOver ? "border-orange bg-orange/5" : "border-[var(--border-on-light)] hover:border-orange",
          displayError && "border-danger",
        )}
      >
        <p className="text-sm font-medium text-heading">{t(locale, "optimizer.wizard.cvUpload.dropzone")}</p>
        <p className="mono-label text-[10px] text-text-muted">{t(locale, "optimizer.wizard.cvUpload.formats")}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_CV_UPLOAD_MIME_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (selected) acceptFile(selected);
          e.target.value = "";
        }}
      />
      {displayError && (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {displayError}
        </p>
      )}
    </div>
  );
}

/** `/optimizer/new` — the 2-step report creation flow, as its own page
 * (not a `Modal` — see the file this replaced, `NewReportModal.tsx`'s own
 * comment, for why that was the first pass). Step 1's job-description input
 * and step 2's CV source are both 2-way exclusive choices, presented as
 * segmented controls — the same visual idiom as `CvLanguagePicker`'s locale
 * toggle. Picking one clears/replaces the other so the submit payload is
 * always unambiguous (matches the contract's `.refine` for the job
 * description, and the two mutually-exclusive creation routes for the CV
 * source — see api.ts's `createReport` vs `createReportFromUpload`). */
function NewReportForm({ locale }: { locale: BuilderLocale }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [roleTitle, setRoleTitle] = useState("");
  const [mode, setMode] = useState<DescriptionMode>("text");
  const [jobDescriptionText, setJobDescriptionText] = useState("");
  const [jobDescriptionUrl, setJobDescriptionUrl] = useState("");
  const [cvSourceMode, setCvSourceMode] = useState<CvSourceMode>("existing");
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const cvsQuery = useQuery({ queryKey: ["cvs"], queryFn: listCvs });

  const createMutation = useMutation({
    mutationFn: (
      input:
        | { source: "existing"; data: CreateCvOptimizerReportInput }
        | { source: "upload"; data: CreateCvOptimizerReportFromUploadInput; file: File },
    ) =>
      input.source === "existing"
        ? createReport(input.data)
        : createReportFromUpload(input.data, input.file),
    onSuccess: (report) => {
      window.location.href = reportDetailPath(report.id);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setFormError(err.message);
        if (err.fields) setFieldErrors(err.fields);
      } else {
        setFormError(t(locale, "common.error.generic"));
      }
    },
  });

  function handleNext() {
    const errors: Record<string, string> = {};
    if (!roleTitle.trim()) errors.roleTitle = t(locale, "optimizer.wizard.error.roleRequired");
    if (mode === "text" && !jobDescriptionText.trim()) {
      errors.jobDescriptionText = t(locale, "optimizer.wizard.error.jobDescriptionRequired");
    }
    if (mode === "url" && !jobDescriptionUrl.trim()) {
      errors.jobDescriptionUrl = t(locale, "optimizer.wizard.error.jobDescriptionRequired");
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setFormError(null);
    setStep(2);
  }

  function handleSubmit() {
    if (cvSourceMode === "existing" && !selectedCvId) {
      setFormError(t(locale, "optimizer.wizard.error.selectCv"));
      return;
    }
    if (cvSourceMode === "upload" && !uploadedFile) {
      setFormError(t(locale, "optimizer.wizard.error.uploadCv"));
      return;
    }
    setFormError(null);
    setFieldErrors({});
    const jobDescriptionFields =
      mode === "text"
        ? { jobDescriptionText: jobDescriptionText.trim() }
        : { jobDescriptionUrl: jobDescriptionUrl.trim() };

    if (cvSourceMode === "existing") {
      createMutation.mutate({
        source: "existing",
        data: { cvId: selectedCvId as string, roleTitle: roleTitle.trim(), ...jobDescriptionFields },
      });
    } else {
      createMutation.mutate({
        source: "upload",
        data: { roleTitle: roleTitle.trim(), ...jobDescriptionFields },
        file: uploadedFile as File,
      });
    }
  }

  return (
    <div className="mx-auto max-w-[90rem] px-5 py-10 sm:px-8">
      <a href="/optimizer" className="mono-label text-xs text-orange hover:text-accent-hover">
        {t(locale, "optimizer.detail.back")}
      </a>

      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-heading">
        {t(locale, "optimizer.wizard.title")}
      </h1>

      <Card className="mt-6 p-6 sm:p-8">
        <div className="flex flex-col gap-5">
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-base font-bold text-heading">{t(locale, "optimizer.wizard.step1.heading")}</h2>

              <Input
                id="wizard-role-title"
                label={t(locale, "optimizer.wizard.roleTitle.label")}
                required
                placeholder={t(locale, "optimizer.wizard.roleTitle.placeholder")}
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                error={fieldErrors.roleTitle}
              />

              <div className="mx-2 flex flex-col gap-1.5">
                <span className="text-sm font-medium text-heading">
                  {t(locale, "optimizer.wizard.jobDescription.label")}
                  <span className="ml-0.5 text-orange">*</span>
                </span>
                <div
                  role="radiogroup"
                  aria-label={t(locale, "optimizer.wizard.jobDescription.label")}
                  className="inline-flex w-fit rounded-md border border-[var(--border-on-light)] bg-surface-sunken/60 p-0.5"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={mode === "text"}
                    onClick={() => {
                      setMode("text");
                      setJobDescriptionUrl("");
                      setFieldErrors((prev) => {
                        const { jobDescriptionUrl: _removed, ...rest } = prev;
                        return rest;
                      });
                    }}
                    className={clsx(
                      "mono-label rounded-[5px] px-3 py-1.5 text-[11px] transition-colors duration-fast ease-standard",
                      mode === "text" ? "bg-white text-heading shadow-sm" : "text-text-muted hover:text-heading",
                    )}
                  >
                    {t(locale, "optimizer.wizard.mode.text")}
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={mode === "url"}
                    onClick={() => {
                      setMode("url");
                      setJobDescriptionText("");
                      setFieldErrors((prev) => {
                        const { jobDescriptionText: _removed, ...rest } = prev;
                        return rest;
                      });
                    }}
                    className={clsx(
                      "mono-label rounded-[5px] px-3 py-1.5 text-[11px] transition-colors duration-fast ease-standard",
                      mode === "url" ? "bg-white text-heading shadow-sm" : "text-text-muted hover:text-heading",
                    )}
                  >
                    {t(locale, "optimizer.wizard.mode.url")}
                  </button>
                </div>
              </div>

              {mode === "text" ? (
                <FieldShell
                  label={t(locale, "optimizer.wizard.jobDescriptionText.label")}
                  htmlFor="wizard-jd-text"
                  required
                  error={fieldErrors.jobDescriptionText}
                >
                  <textarea
                    id="wizard-jd-text"
                    rows={10}
                    placeholder={t(locale, "optimizer.wizard.jobDescriptionText.placeholder")}
                    value={jobDescriptionText}
                    onChange={(e) => setJobDescriptionText(e.target.value)}
                    className={clsx(
                      inputBaseClasses,
                      "resize-y",
                      fieldErrors.jobDescriptionText ? clsx("border-danger", focusRingErrorClasses) : focusRingClasses,
                    )}
                  />
                </FieldShell>
              ) : (
                <Input
                  id="wizard-jd-url"
                  label={t(locale, "optimizer.wizard.jobDescriptionUrl.label")}
                  type="url"
                  required
                  placeholder={t(locale, "optimizer.wizard.jobDescriptionUrl.placeholder")}
                  value={jobDescriptionUrl}
                  onChange={(e) => setJobDescriptionUrl(e.target.value)}
                  error={fieldErrors.jobDescriptionUrl}
                />
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-base font-bold text-heading">{t(locale, "optimizer.wizard.step2.heading")}</h2>

              <div
                role="radiogroup"
                aria-label={t(locale, "optimizer.wizard.step2.heading")}
                className="inline-flex w-fit rounded-md border border-[var(--border-on-light)] bg-surface-sunken/60 p-0.5"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={cvSourceMode === "existing"}
                  onClick={() => setCvSourceMode("existing")}
                  className={clsx(
                    "mono-label rounded-[5px] px-3 py-1.5 text-[11px] transition-colors duration-fast ease-standard",
                    cvSourceMode === "existing" ? "bg-white text-heading shadow-sm" : "text-text-muted hover:text-heading",
                  )}
                >
                  {t(locale, "optimizer.wizard.step2.mode.existing")}
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={cvSourceMode === "upload"}
                  onClick={() => setCvSourceMode("upload")}
                  className={clsx(
                    "mono-label rounded-[5px] px-3 py-1.5 text-[11px] transition-colors duration-fast ease-standard",
                    cvSourceMode === "upload" ? "bg-white text-heading shadow-sm" : "text-text-muted hover:text-heading",
                  )}
                >
                  {t(locale, "optimizer.wizard.step2.mode.upload")}
                </button>
              </div>

              {cvSourceMode === "existing" ? (
                <>
                  {cvsQuery.isLoading && <p className="mono-label text-xs text-text-muted">{t(locale, "common.loading")}</p>}
                  {cvsQuery.isError && <p className="text-sm text-danger">{t(locale, "common.error.generic")}</p>}

                  {cvsQuery.data && cvsQuery.data.length === 0 && (
                    <p className="text-sm text-text-muted">{t(locale, "optimizer.wizard.step2.empty")}</p>
                  )}

                  {cvsQuery.data && cvsQuery.data.length > 0 && (
                    <ul className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto">
                      {cvsQuery.data.map((cv) => {
                        const selected = selectedCvId === cv.id;
                        return (
                          <li key={cv.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedCvId(cv.id)}
                              className={clsx(
                                "flex w-full items-center justify-between gap-4 rounded-md border p-3 text-left transition-colors duration-fast ease-standard",
                                selected
                                  ? "border-orange bg-orange/5 ring-2 ring-orange/30"
                                  : "border-[var(--border-on-light)] hover:bg-surface-sunken",
                              )}
                            >
                              <div>
                                <p className="font-display text-sm font-bold text-heading">{cv.title}</p>
                                <p className="mono-label mt-0.5 text-[10px] text-text-muted">
                                  {cv.contentLanguage} · {cv.templateId}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="text-xs text-text-muted">{formatDate(cv.updatedAt, locale)}</span>
                                {selected && <CheckIcon className="shrink-0 text-orange" />}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              ) : (
                <CvUploadField locale={locale} file={uploadedFile} onChange={setUploadedFile} error={fieldErrors.cvFile} />
              )}
            </div>
          )}

          {formError && (
            <p role="alert" className="text-sm text-danger">
              {formError}
            </p>
          )}

          <div className="flex items-center justify-between border-t border-[var(--border-on-light)] pt-4">
            {step === 2 ? (
              <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                {t(locale, "optimizer.wizard.back")}
              </Button>
            ) : (
              <span />
            )}
            {step === 1 ? (
              <Button type="button" onClick={handleNext}>
                {t(locale, "optimizer.wizard.next")}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                loading={createMutation.isPending}
                disabled={cvSourceMode === "existing" ? !selectedCvId : !uploadedFile}
              >
                {createMutation.isPending ? t(locale, "optimizer.wizard.submitting") : t(locale, "optimizer.wizard.submit")}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function NewReportBody({ user }: { user: AuthUser }) {
  const locale = useBuilderLocale();
  const subscriptionQuery = useQuery({ queryKey: ["subscription"], queryFn: () => billingApi.getSubscription() });
  const entitled = hasActiveEntitlement(subscriptionQuery.data ?? null, user.role);

  if (subscriptionQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="mono-label text-xs text-text-muted">{t(locale, "common.loading")}</p>
      </div>
    );
  }

  return entitled ? <NewReportForm locale={locale} /> : <NotEntitled locale={locale} />;
}

export function NewReportPage() {
  return (
    <AppQueryProvider>
      <RequireAuth>{(user) => <NewReportBody user={user} />}</RequireAuth>
    </AppQueryProvider>
  );
}
