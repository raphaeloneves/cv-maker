import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../plugins/auth.js";
import * as service from "./service.js";

export async function registerAcademyRoutes(app: FastifyInstance) {
  app.get("/academy/outline", { preHandler: requireAuth }, async (req) => {
    return service.getOutline(req.user!.id, req.user!.role);
  });

  app.get("/academy/lessons/:slug", { preHandler: requireAuth }, async (req) => {
    const { slug } = req.params as { slug: string };
    return service.getLessonContent(slug, req.user!.id, req.user!.role);
  });

  app.post("/academy/lessons/:slug/complete", { preHandler: requireAuth }, async (req, reply) => {
    const { slug } = req.params as { slug: string };
    await service.markComplete(slug, req.user!.id, req.user!.role);
    reply.code(204);
  });
}
