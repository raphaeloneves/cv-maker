import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { genderSchema, type CvContentLanguage, type Gender } from "@cv-maker/contracts";
import { Button, Card, Input, Select, SaveStatus, clsx } from "@/components/ui";
import { t } from "@/i18n";
import { getStoredLocale } from "@/lib/locale";
import { getCv, updateCv } from "@/domains/cvs/api";
import { withCvId } from "@/lib/use-cv-id";
import { usePersonalInfoAutosave } from "@/domains/personal-info/hooks/usePersonalInfoAutosave";
import { PhotoField } from "@/domains/personal-info/components/PhotoField";

const CURRENT_YEAR = new Date().getFullYear();
// Dynamic range (current year back ~120 years) — fixes the reference
// product's hard-coded cutoff at 2015 (features/01, opportunity #2).
const BIRTH_YEARS = Array.from({ length: 121 }, (_, i) => CURRENT_YEAR - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function monthLabel(month: number, locale: string): string {
  const intlLocale = locale === "pt-PT" ? "pt-PT" : "en-GB";
  return new Intl.DateTimeFormat(intlLocale, { month: "long" }).format(new Date(2000, month - 1, 1));
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

interface PersonalInfoFormProps {
  cvId: string;
}

export function PersonalInfoForm({ cvId }: PersonalInfoFormProps) {
  const locale = getStoredLocale();
  const queryClient = useQueryClient();
  const { form, update, saveNow, saveState, isLoading } = usePersonalInfoAutosave(cvId);

  const [expanded, setExpanded] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [dob, setDob] = useState<{ day: string; month: string; year: string }>({ day: "", month: "", year: "" });
  const [dobInitialized, setDobInitialized] = useState(false);

  useEffect(() => {
    if (!dobInitialized && form) {
      const d = form.dateOfBirth;
      setDob({ day: d?.day ? String(d.day) : "", month: d?.month ? String(d.month) : "", year: d?.year ? String(d.year) : "" });
      setDobInitialized(true);
    }
  }, [form, dobInitialized]);

  const cvQuery = useQuery({ queryKey: ["cv", cvId], queryFn: () => getCv(cvId) });
  const cvLanguageMutation = useMutation({
    mutationFn: (contentLanguage: CvContentLanguage) => updateCv(cvId, { contentLanguage }),
    onSuccess: (cv) => queryClient.setQueryData(["cv", cvId], cv),
  });

  const requiredErrors = useMemo(() => {
    if (!form) return {};
    const errors: Record<string, string> = {};
    if (!form.firstName?.trim()) errors.firstName = t(locale, "personalInfo.error.required");
    if (!form.lastName?.trim()) errors.lastName = t(locale, "personalInfo.error.required");
    if (!form.address?.trim()) errors.address = t(locale, "personalInfo.error.required");
    if (!form.email?.trim()) errors.email = t(locale, "personalInfo.error.required");
    else if (!isValidEmail(form.email)) errors.email = t(locale, "personalInfo.error.email");
    return errors;
  }, [form, locale]);

  function updateDob(next: { day: string; month: string; year: string }) {
    setDob(next);
    if (next.day && next.month && next.year) {
      update({ dateOfBirth: { day: Number(next.day), month: Number(next.month), year: Number(next.year) } });
    } else {
      update({ dateOfBirth: null });
    }
  }

  function handleNext(e: React.MouseEvent) {
    if (Object.keys(requiredErrors).length > 0) {
      e.preventDefault();
      setTouched({ firstName: true, lastName: true, address: true, email: true });
    }
  }

  if (isLoading || !form) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="mono-label text-xs text-text-muted">{t(locale, "common.loading")}</p>
      </div>
    );
  }

  const gender = (form.gender ?? "") as Gender | "";

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-heading">
              {t(locale, "personalInfo.title")}
            </h1>
            <p className="mt-1 text-sm text-text-muted">{t(locale, "personalInfo.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <SaveStatus state={saveState} />
            <div className="w-40">
              <Select
                id="cv-language"
                label={t(locale, "personalInfo.cvLanguage")}
                value={cvQuery.data?.contentLanguage ?? "en"}
                onChange={(e) => cvLanguageMutation.mutate(e.target.value as CvContentLanguage)}
              >
                <option value="en">English</option>
                <option value="pt-PT">Português</option>
              </Select>
            </div>
          </div>
        </div>

        <div className="mb-6 flex justify-center sm:justify-start">
          <PhotoField
            cvId={cvId}
            photoUrl={form.photoUrl}
            onSaved={(photoUrl, crop) => saveNow({ photoUrl, photoCrop: crop })}
            onRemoved={() => saveNow({ photoUrl: null, photoCrop: null })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="firstName"
            label={t(locale, "personalInfo.firstName")}
            required
            value={form.firstName ?? ""}
            onChange={(e) => update({ firstName: e.target.value })}
            onBlur={() => setTouched((p) => ({ ...p, firstName: true }))}
            error={touched.firstName ? requiredErrors.firstName : null}
          />
          <Input
            id="lastName"
            label={t(locale, "personalInfo.lastName")}
            required
            value={form.lastName ?? ""}
            onChange={(e) => update({ lastName: e.target.value })}
            onBlur={() => setTouched((p) => ({ ...p, lastName: true }))}
            error={touched.lastName ? requiredErrors.lastName : null}
          />
          <Input
            id="email"
            label={t(locale, "personalInfo.email")}
            type="email"
            required
            value={form.email ?? ""}
            onChange={(e) => update({ email: e.target.value })}
            onBlur={() => setTouched((p) => ({ ...p, email: true }))}
            error={touched.email ? requiredErrors.email : null}
          />
          <Input
            id="address"
            label={t(locale, "personalInfo.address")}
            required
            value={form.address ?? ""}
            onChange={(e) => update({ address: e.target.value })}
            onBlur={() => setTouched((p) => ({ ...p, address: true }))}
            error={touched.address ? requiredErrors.address : null}
          />
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mono-label mt-6 text-xs text-orange hover:text-accent-hover"
        >
          {expanded ? t(locale, "personalInfo.additionalInfo.hide") : t(locale, "personalInfo.additionalInfo.show")}
        </button>

        {/* Fields stay mounted at all times (grid-rows 0fr/1fr trick) so
         * collapsing never loses state — features/01's "preserve entered
         * data on collapse" requirement, satisfied structurally rather than
         * by re-hydrating from saved state. */}
        <div
          className={clsx(
            "grid overflow-hidden transition-[grid-template-rows] duration-standard ease-standard",
            expanded ? "grid-rows-[1fr] mt-4" : "grid-rows-[0fr]",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <p className="mb-4 text-xs text-text-muted">{t(locale, "personalInfo.additionalInfo.hint")}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="phone"
                label={t(locale, "personalInfo.phone")}
                value={form.phone ?? ""}
                onChange={(e) => update({ phone: e.target.value })}
              />
              <Input
                id="postalCode"
                label={t(locale, "personalInfo.postalCode")}
                value={form.postalCode ?? ""}
                onChange={(e) => update({ postalCode: e.target.value })}
              />
              <Input
                id="city"
                label={t(locale, "personalInfo.city")}
                placeholder={t(locale, "personalInfo.city.placeholder")}
                value={form.city ?? ""}
                onChange={(e) => update({ city: e.target.value })}
              />
              <Input
                id="placeOfBirth"
                label={t(locale, "personalInfo.placeOfBirth")}
                value={form.placeOfBirth ?? ""}
                onChange={(e) => update({ placeOfBirth: e.target.value })}
              />

              <div className="sm:col-span-2">
                <p className="mb-1.5 text-sm font-medium text-heading">{t(locale, "personalInfo.dateOfBirth")}</p>
                <div className="grid grid-cols-3 gap-3">
                  <Select
                    id="dob-day"
                    label={t(locale, "personalInfo.dateOfBirth.day")}
                    value={dob.day}
                    onChange={(e) => updateDob({ ...dob, day: e.target.value })}
                  >
                    <option value="">—</option>
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                  <Select
                    id="dob-month"
                    label={t(locale, "personalInfo.dateOfBirth.month")}
                    value={dob.month}
                    onChange={(e) => updateDob({ ...dob, month: e.target.value })}
                  >
                    <option value="">—</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {monthLabel(m, locale)}
                      </option>
                    ))}
                  </Select>
                  <Select
                    id="dob-year"
                    label={t(locale, "personalInfo.dateOfBirth.year")}
                    value={dob.year}
                    onChange={(e) => updateDob({ ...dob, year: e.target.value })}
                  >
                    <option value="">—</option>
                    {BIRTH_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <Input
                id="drivingLicence"
                label={t(locale, "personalInfo.drivingLicence")}
                value={form.drivingLicence ?? ""}
                onChange={(e) => update({ drivingLicence: e.target.value })}
              />

              <div>
                <Select
                  id="gender"
                  label={t(locale, "personalInfo.gender")}
                  value={gender}
                  onChange={(e) => update({ gender: (e.target.value || null) as Gender | null })}
                >
                  <option value="">{t(locale, "personalInfo.gender.placeholder")}</option>
                  {genderSchema.options.map((option) => (
                    <option key={option} value={option}>
                      {t(locale, `personalInfo.gender.${option}`)}
                    </option>
                  ))}
                </Select>
                {gender === "self_described" && (
                  <div className="mt-3">
                    <Input
                      id="genderSelfDescribed"
                      label={t(locale, "personalInfo.genderSelfDescribed")}
                      value={form.genderSelfDescribed ?? ""}
                      onChange={(e) => update({ genderSelfDescribed: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <Input
                id="nationality"
                label={t(locale, "personalInfo.nationality")}
                value={form.nationality ?? ""}
                onChange={(e) => update({ nationality: e.target.value })}
              />
              <Input
                id="maritalStatus"
                label={t(locale, "personalInfo.maritalStatus")}
                value={form.maritalStatus ?? ""}
                onChange={(e) => update({ maritalStatus: e.target.value })}
              />
              <Input
                id="linkedin"
                label={t(locale, "personalInfo.linkedin")}
                value={form.linkedin ?? ""}
                onChange={(e) => update({ linkedin: e.target.value })}
              />
              <Input
                id="website"
                label={t(locale, "personalInfo.website")}
                value={form.website ?? ""}
                onChange={(e) => update({ website: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <span />
        <a href={withCvId("/builder/content", cvId)} onClick={handleNext}>
          <Button size="lg">{t(locale, "builder.next")}</Button>
        </a>
      </div>
    </div>
  );
}
