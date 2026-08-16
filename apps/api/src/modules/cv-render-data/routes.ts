import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../plugins/auth.js";
import { getRenderData } from "./service.js";

export async function registerCvRenderDataRoutes(app: FastifyInstance) {
  app.get("/cvs/:cvId/render-data", { preHandler: requireAuth }, async (req) => {
    const { cvId } = req.params as { cvId: string };
    return getRenderData(cvId, req.user!.id, req.user!.role);
  });
}
