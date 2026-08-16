import type { CvContentLanguage, DescriptiveLevel } from "@cv-maker/contracts";

/** Small, render-only i18n strings that don't belong in packages/contracts —
 * these are display text for the CV templates themselves (month names, meter
 * labels), not shared behavior any other package needs. Keyed the same way
 * as contracts/src/section-titles.ts for consistency. */

const MONTH_NAMES: Record<CvContentLanguage, readonly string[]> = {
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  "pt-PT": [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ],
};

export function monthName(month: number, lang: CvContentLanguage): string {
  return MONTH_NAMES[lang][month - 1] ?? String(month);
}

export const PRESENT_LABEL: Record<CvContentLanguage, string> = {
  en: "Present",
  "pt-PT": "Presente",
};

/** Evenly-spaced 1-5 skill scale (features/07) rendered as a text label for
 * the "text" meter style. */
const SKILL_LEVEL_LABELS: Record<CvContentLanguage, readonly [string, string, string, string, string]> = {
  en: ["Beginner", "Basic", "Intermediate", "Advanced", "Expert"],
  "pt-PT": ["Iniciante", "Básico", "Intermédio", "Avançado", "Especialista"],
};

export function skillLevelLabel(level: number, lang: CvContentLanguage): string {
  const clamped = Math.min(5, Math.max(1, Math.round(level)));
  return SKILL_LEVEL_LABELS[lang][clamped - 1] ?? SKILL_LEVEL_LABELS[lang][0];
}

const DESCRIPTIVE_LEVEL_LABELS: Record<CvContentLanguage, Record<DescriptiveLevel, string>> = {
  en: {
    native: "Native",
    highly_proficient: "Highly Proficient",
    advanced: "Advanced",
    good_working: "Good Working Knowledge",
    working: "Working Knowledge",
  },
  "pt-PT": {
    native: "Nativo",
    highly_proficient: "Altamente Proficiente",
    advanced: "Avançado",
    good_working: "Bom Conhecimento",
    working: "Conhecimento Básico",
  },
};

export function descriptiveLevelLabel(level: DescriptiveLevel, lang: CvContentLanguage): string {
  return DESCRIPTIVE_LEVEL_LABELS[lang][level];
}

/** Labels for the optional "personal details" block (date of birth,
 * nationality, etc.) — European-CV-convention fields on `PersonalInfo` that
 * aren't part of any `RenderSection`. */
export const PERSONAL_DETAIL_LABELS: Record<
  CvContentLanguage,
  {
    dateOfBirth: string;
    placeOfBirth: string;
    nationality: string;
    drivingLicence: string;
    maritalStatus: string;
  }
> = {
  en: {
    dateOfBirth: "Date of birth",
    placeOfBirth: "Place of birth",
    nationality: "Nationality",
    drivingLicence: "Driving licence",
    maritalStatus: "Marital status",
  },
  "pt-PT": {
    dateOfBirth: "Data de nascimento",
    placeOfBirth: "Naturalidade",
    nationality: "Nacionalidade",
    drivingLicence: "Carta de condução",
    maritalStatus: "Estado civil",
  },
};

export const REFERENCES_AVAILABLE_LABEL: Record<CvContentLanguage, string> = {
  en: "References available upon request",
  "pt-PT": "Referências disponíveis mediante pedido",
};

export const WATERMARK_TEXT = "CV Maker";
