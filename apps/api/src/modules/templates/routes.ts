import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { templateIdSchema } from "@cv-maker/contracts";
import type { CvTemplatePreference } from "@cv-maker/contracts";
import { requireAuth } from "../../plugins/auth.js";
import { db } from "../../db.js";
import { assertCvOwnership } from "../sections/section-access.js";
import { enumToDb, enumToDomain } from "../common/enum-map.js";

const colorBodySchema = z.object({ color: z.string().regex(/^#[0-9a-fA-F]{6}$/) });

function toDomain(row: {
  cvId: string;
  templateId: string;
  color: string;
}): CvTemplatePreference {
  return {
    cvId: row.cvId,
    templateId: enumToDomain(row.templateId),
    color: row.color,
  };
}

export async function registerTemplateRoutes(app: FastifyInstance) {
  app.get("/cvs/:cvId/template-preferences", { preHandler: requireAuth }, async (req) => {
    const { cvId } = req.params as { cvId: string };
    await assertCvOwnership(cvId, req.user!.id);
    const rows = await db.cvTemplatePreference.findMany({ where: { cvId } });
    return rows.map(toDomain);
  });

  app.put(
    "/cvs/:cvId/template-preferences/:templateId",
    { preHandler: requireAuth },
    async (req) => {
      const { cvId, templateId } = req.params as { cvId: string; templateId: string };
      await assertCvOwnership(cvId, req.user!.id);
      const parsedTemplateId = templateIdSchema.parse(templateId);
      const { color } = colorBodySchema.parse(req.body);
      const row = await db.cvTemplatePreference.upsert({
        where: { cvId_templateId: { cvId, templateId: enumToDb(parsedTemplateId) } },
        create: { cvId, templateId: enumToDb(parsedTemplateId), color },
        update: { color },
      });
      return toDomain(row);
    },
  );
}
