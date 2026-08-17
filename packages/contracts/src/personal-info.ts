import { z } from "zod";
import { genderSchema } from "./enums.js";

const optionalString = z.string().trim().max(500).optional().nullable();

/** features/01-personal-information.md. Only firstName/lastName/email are
 * required — enforced here AND re-checked server-side (never trust the
 * client-only "required" styling the reference product relies on). Address
 * is deliberately optional: plenty of CVs (remote roles, privacy-conscious
 * applicants, some regions' norms) omit a home address entirely. */
export const personalInfoSchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  address: optionalString,
  phone: optionalString,
  postalCode: optionalString,
  city: optionalString,

  // Progressive-disclosure "Additional information" block — all optional.
  dateOfBirth: z
    .object({
      day: z.number().int().min(1).max(31),
      month: z.number().int().min(1).max(12),
      year: z.number().int().min(1900).max(2100),
    })
    .nullable()
    .optional(),
  placeOfBirth: optionalString,
  drivingLicence: optionalString,
  gender: genderSchema.nullable().optional(),
  genderSelfDescribed: optionalString, // used only when gender === 'self_described'
  nationality: optionalString,
  maritalStatus: optionalString, // deliberately free text, not an enum — see spec
  linkedin: optionalString,
  website: optionalString,

  photoUrl: z.string().url().nullable().optional(),
  photoCrop: z
    .object({ zoom: z.number().min(1).max(4), rotationDeg: z.number().int() })
    .nullable()
    .optional(),
});
export type PersonalInfo = z.infer<typeof personalInfoSchema>;

export const updatePersonalInfoSchema = personalInfoSchema.partial();
export type UpdatePersonalInfo = z.infer<typeof updatePersonalInfoSchema>;
