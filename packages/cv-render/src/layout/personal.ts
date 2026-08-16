import type { CvContentLanguage, PersonalInfo } from "@cv-maker/contracts";
import { PERSONAL_DETAIL_LABELS } from "./i18n.js";

export type ContactItemKind = "email" | "phone" | "location" | "linkedin" | "website";

export interface ContactItem {
  kind: ContactItemKind;
  value: string;
}

/** Every field here is optional except `email`, and even email may be absent
 * when there's no personal info at all yet (edge case: a near-empty CV) — the
 * caller (each template) decides how to lay these out, this just decides
 * *which* items exist and skips blanks so templates never render an empty
 * "•" separator or a dangling label. */
export function buildContactItems(personalInfo: PersonalInfo | null): ContactItem[] {
  if (!personalInfo) return [];

  const items: ContactItem[] = [];
  if (personalInfo.email) items.push({ kind: "email", value: personalInfo.email });
  if (personalInfo.phone) items.push({ kind: "phone", value: personalInfo.phone });

  const location = formatLocation(personalInfo);
  if (location) items.push({ kind: "location", value: location });

  if (personalInfo.linkedin) items.push({ kind: "linkedin", value: personalInfo.linkedin });
  if (personalInfo.website) items.push({ kind: "website", value: personalInfo.website });

  return items;
}

function formatLocation(personalInfo: PersonalInfo): string | null {
  const parts = [personalInfo.address, personalInfo.postalCode, personalInfo.city].filter(
    (part): part is string => Boolean(part && part.trim().length > 0),
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

export interface PersonalDetailItem {
  label: string;
  value: string;
}

/** The optional, European-CV-convention "personal details" block (date of
 * birth, nationality, driving licence, marital status, place of birth) — not
 * part of any `RenderSection`, so each template that wants to show it pulls
 * from `PersonalInfo` directly via this helper. */
export function buildPersonalDetails(
  personalInfo: PersonalInfo | null,
  lang: CvContentLanguage,
): PersonalDetailItem[] {
  if (!personalInfo) return [];
  const labels = PERSONAL_DETAIL_LABELS[lang];
  const items: PersonalDetailItem[] = [];

  if (personalInfo.dateOfBirth) {
    const { day, month, year } = personalInfo.dateOfBirth;
    const pad = (n: number) => String(n).padStart(2, "0");
    items.push({ label: labels.dateOfBirth, value: `${pad(day)}/${pad(month)}/${year}` });
  }
  if (personalInfo.placeOfBirth) items.push({ label: labels.placeOfBirth, value: personalInfo.placeOfBirth });
  if (personalInfo.nationality) items.push({ label: labels.nationality, value: personalInfo.nationality });
  if (personalInfo.drivingLicence) {
    items.push({ label: labels.drivingLicence, value: personalInfo.drivingLicence });
  }
  if (personalInfo.maritalStatus) items.push({ label: labels.maritalStatus, value: personalInfo.maritalStatus });

  return items;
}

export function fullName(personalInfo: PersonalInfo | null): string {
  if (!personalInfo) return "";
  return [personalInfo.firstName, personalInfo.lastName].filter(Boolean).join(" ").trim();
}
