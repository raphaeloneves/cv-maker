import { db } from "../../db.js";

export function findPersonalInfoByCv(cvId: string) {
  return db.personalInfo.findUnique({ where: { cvId } });
}

export function createPersonalInfo(cvId: string, data: Record<string, unknown>) {
  return db.personalInfo.create({ data: { cvId, ...data } as never });
}

export function updatePersonalInfo(cvId: string, data: Record<string, unknown>) {
  return db.personalInfo.update({ where: { cvId }, data: data as never });
}

export function clearPersonalInfoPhoto(cvId: string) {
  return db.personalInfo.update({
    where: { cvId },
    data: { photoUrl: null, photoZoom: null, photoRotationDeg: null },
  });
}

export function setPersonalInfoPhotoUrl(cvId: string, photoUrl: string) {
  return db.personalInfo.update({ where: { cvId }, data: { photoUrl } });
}
