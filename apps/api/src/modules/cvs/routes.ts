import type { FastifyInstance } from "fastify";
import { createCvSchema, updateCvSchema } from "@cv-maker/contracts";
import { requireAuth } from "../../plugins/auth.js";
import * as service from "./service.js";

export async function registerCvRoutes(app: FastifyInstance) {
  app.get("/cvs", { preHandler: requireAuth }, async (req) => {
    return service.listCvs(req.user!.id);
  });

  app.post("/cvs", { preHandler: requireAuth }, async (req, reply) => {
    const input = createCvSchema.parse(req.body ?? {});
    const cv = await service.createCv(req.user!.id, input);
    reply.code(201);
    return cv;
  });

  app.get("/cvs/:cvId", { preHandler: requireAuth }, async (req) => {
    const { cvId } = req.params as { cvId: string };
    return service.getCv(cvId, req.user!.id);
  });

  app.patch("/cvs/:cvId", { preHandler: requireAuth }, async (req) => {
    const { cvId } = req.params as { cvId: string };
    const input = updateCvSchema.parse(req.body);
    return service.updateCv(cvId, req.user!.id, input);
  });

  app.delete("/cvs/:cvId", { preHandler: requireAuth }, async (req, reply) => {
    const { cvId } = req.params as { cvId: string };
    await service.deleteCv(cvId, req.user!.id);
    reply.code(204);
    return null;
  });
}
