import type { CvContentLanguage, SectionType } from "./enums.js";

/** Default on-CV section heading, keyed by (sectionType, cvContentLanguage).
 * Only used when a section's `displayName` override is null — a user-set
 * custom name always wins verbatim and must never be overwritten when
 * `cvContentLanguage` changes later (features/03, features/15). */
export const DEFAULT_SECTION_TITLES: Record<SectionType, Record<CvContentLanguage, string>> = {
  profile_summary: { "pt-PT": "Perfil", en: "Profile" },
  work_experience: { "pt-PT": "Experiência Profissional", en: "Work Experience" },
  education: { "pt-PT": "Formação e Qualificações", en: "Education & Qualifications" },
  skills: { "pt-PT": "Aptidões", en: "Skills" },
  hobbies: { "pt-PT": "Interesses", en: "Hobbies & Interests" },
  references: { "pt-PT": "Referências", en: "References" },
  languages: { "pt-PT": "Idiomas", en: "Languages" },
  courses: { "pt-PT": "Cursos e Certificações", en: "Courses & Certifications" },
  achievements: { "pt-PT": "Conquistas", en: "Achievements" },
  publications: { "pt-PT": "Publicações", en: "Publications" },
  custom: { "pt-PT": "Secção Personalizada", en: "Custom Section" },
};

export function resolveSectionTitle(
  type: SectionType,
  contentLanguage: CvContentLanguage,
  displayNameOverride: string | null,
): string {
  return displayNameOverride ?? DEFAULT_SECTION_TITLES[type][contentLanguage];
}
