import type { PersonalInfo, UpdatePersonalInfo } from "@cv-maker/contracts";
import { badRequest } from "../../errors.js";
import * as repo from "./repository.js";
import { buildPersonalInfoWriteData, personalInfoToDomain } from "./mapper.js";

export async function getPersonalInfo(cvId: string): Promise<PersonalInfo | null> {
  const row = await repo.findPersonalInfoByCv(cvId);
  return row ? personalInfoToDomain(row) : null;
}

// Address is deliberately not required here — see contracts/personal-info.ts.
const REQUIRED_FIELDS = ["firstName", "lastName", "email"] as const;

export async function upsertPersonalInfo(
  cvId: string,
  input: UpdatePersonalInfo,
): Promise<PersonalInfo> {
  const existing = await repo.findPersonalInfoByCv(cvId);
  const data = buildPersonalInfoWriteData(input);

  if (!existing) {
    const missing: Record<string, string> = {};
    for (const field of REQUIRED_FIELDS) {
      if (!data[field]) missing[field] = "required";
    }
    if (Object.keys(missing).length > 0) {
      throw badRequest("Missing required personal info fields", missing);
    }
    const row = await repo.createPersonalInfo(cvId, data);
    return personalInfoToDomain(row);
  }

  const row = await repo.updatePersonalInfo(cvId, data);
  return personalInfoToDomain(row);
}
