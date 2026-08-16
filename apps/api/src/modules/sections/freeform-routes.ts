import type { FastifyInstance } from "fastify";
import { FREEFORM_SECTION_TYPES, freeformSectionContentSchema } from "@cv-maker/contracts";
import { requireAuth } from "../../plugins/auth.js";
import { badRequest } from "../../errors.js";
import { db } from "../../db.js";
import { getOwnedSection } from "./section-access.js";
import { sectionToDomain } from "./repository.js";

// `profile_summary` shares the exact same "single rich-text body" shape as
// achievements/publications/custom (see sections/profile-summary.ts +
// sections/freeform.ts in contracts) — one route handles all four.
const ALLOWED_TYPES = new Set([...FREEFORM_SECTION_TYPES, "profile_summary"]);

export async function registerFreeformSectionRoutes(app: FastifyInstance) {
  app.get("/sections/:sectionId/freeform", { preHandler: requireAuth }, async (req) => {
    const { sectionId } = req.params as { sectionId: string };
    const section = await getOwnedSection(sectionId, req.user!.id);
    const domainType = section.type.toLowerCase();
    if (!ALLOWED_TYPES.has(domainType as (typeof FREEFORM_SECTION_TYPES)[number])) {
      throw badRequest(
        `Section type "${domainType}" is not a freeform section — use its structured-entry endpoints instead`,
      );
    }
    const row = await db.section.findUniqueOrThrow({ where: { id: sectionId } });
    return { description: row.freeformDescription };
  });

  app.patch("/sections/:sectionId/freeform", { preHandler: requireAuth }, async (req) => {
    const { sectionId } = req.params as { sectionId: string };
    const section = await getOwnedSection(sectionId, req.user!.id);
    const domainType = section.type.toLowerCase();
    if (!ALLOWED_TYPES.has(domainType as (typeof FREEFORM_SECTION_TYPES)[number])) {
      throw badRequest(
        `Section type "${domainType}" is not a freeform section — use its structured-entry endpoints instead`,
      );
    }
    const input = freeformSectionContentSchema.parse(req.body);
    const row = await db.section.update({
      where: { id: sectionId },
      data: { freeformDescription: input.description },
    });
    return sectionToDomain(row);
  });
}
