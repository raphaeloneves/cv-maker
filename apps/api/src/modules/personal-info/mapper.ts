import type { PersonalInfo, UpdatePersonalInfo } from "@cv-maker/contracts";
import { enumToDb, enumToDomain } from "../common/enum-map.js";
import type { PersonalInfo as PrismaPersonalInfo } from "../../../generated/client/index.js";

export function personalInfoToDomain(row: PrismaPersonalInfo): PersonalInfo {
  return {
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    address: row.address,
    phone: row.phone,
    postalCode: row.postalCode,
    city: row.city,
    dateOfBirth:
      row.dobDay != null && row.dobMonth != null && row.dobYear != null
        ? { day: row.dobDay, month: row.dobMonth, year: row.dobYear }
        : null,
    placeOfBirth: row.placeOfBirth,
    drivingLicence: row.drivingLicence,
    gender: row.gender ? enumToDomain<NonNullable<PersonalInfo["gender"]>>(row.gender) : null,
    genderSelfDescribed: row.genderSelfDescribed,
    nationality: row.nationality,
    maritalStatus: row.maritalStatus,
    linkedin: row.linkedin,
    website: row.website,
    photoUrl: row.photoUrl,
    photoCrop:
      row.photoZoom != null || row.photoRotationDeg != null
        ? { zoom: row.photoZoom ?? 1, rotationDeg: row.photoRotationDeg ?? 0 }
        : null,
  };
}

/** Only writes keys explicitly present in `input` (partial-update semantics)
 * — an omitted key leaves the stored value untouched, while an explicit
 * `null` clears it. */
export function buildPersonalInfoWriteData(input: UpdatePersonalInfo): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if ("firstName" in input) data.firstName = input.firstName;
  if ("lastName" in input) data.lastName = input.lastName;
  if ("email" in input) data.email = input.email;
  if ("address" in input) data.address = input.address;
  if ("phone" in input) data.phone = input.phone ?? null;
  if ("postalCode" in input) data.postalCode = input.postalCode ?? null;
  if ("city" in input) data.city = input.city ?? null;
  if ("dateOfBirth" in input) {
    const dob = input.dateOfBirth;
    data.dobDay = dob ? dob.day : null;
    data.dobMonth = dob ? dob.month : null;
    data.dobYear = dob ? dob.year : null;
  }
  if ("placeOfBirth" in input) data.placeOfBirth = input.placeOfBirth ?? null;
  if ("drivingLicence" in input) data.drivingLicence = input.drivingLicence ?? null;
  if ("gender" in input) data.gender = input.gender ? enumToDb(input.gender) : null;
  if ("genderSelfDescribed" in input) data.genderSelfDescribed = input.genderSelfDescribed ?? null;
  if ("nationality" in input) data.nationality = input.nationality ?? null;
  if ("maritalStatus" in input) data.maritalStatus = input.maritalStatus ?? null;
  if ("linkedin" in input) data.linkedin = input.linkedin ?? null;
  if ("website" in input) data.website = input.website ?? null;
  if ("photoUrl" in input) data.photoUrl = input.photoUrl ?? null;
  if ("photoCrop" in input) {
    const crop = input.photoCrop;
    data.photoZoom = crop ? crop.zoom : null;
    data.photoRotationDeg = crop ? crop.rotationDeg : null;
  }
  return data;
}
