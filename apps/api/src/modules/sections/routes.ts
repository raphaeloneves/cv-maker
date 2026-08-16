import type { FastifyInstance } from "fastify";
import { createSectionSchema, reorderSectionsSchema, updateSectionSchema } from "@cv-maker/contracts";
import { requireAuth } from "../../plugins/auth.js";
import * as service from "./service.js";

export async function registerSectionRoutes(app: FastifyInstance) {
  app.get("/cvs/:cvId/sections", { preHandler: requireAuth }, async (req) => {
    const { cvId } = req.params as { cvId: string };
    return service.listSections(cvId, req.user!.id);
  });

  app.post("/cvs/:cvId/sections", { preHandler: requireAuth }, async (req, reply) => {
    const { cvId } = req.params as { cvId: string };
    const input = createSectionSchema.parse(req.body);
    const section = await service.createSection(cvId, req.user!.id, input);
    reply.code(201);
    return section;
  });

  app.patch("/cvs/:cvId/sections/:sectionId", { preHandler: requireAuth }, async (req) => {
    const { sectionId } = req.params as { cvId: string; sectionId: string };
    const input = updateSectionSchema.parse(req.body);
    return service.updateSection(sectionId, req.user!.id, input);
  });

  app.delete("/cvs/:cvId/sections/:sectionId", { preHandler: requireAuth }, async (req, reply) => {
    const { sectionId } = req.params as { cvId: string; sectionId: string };
    await service.deleteSection(sectionId, req.user!.id);
    reply.code(204);
    return null;
  });

  app.post("/cvs/:cvId/sections/reorder", { preHandler: requireAuth }, async (req) => {
    const { cvId } = req.params as { cvId: string };
    const input = reorderSectionsSchema.parse(req.body);
    return service.reorderSections(cvId, req.user!.id, input);
  });
}
