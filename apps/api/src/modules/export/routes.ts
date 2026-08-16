import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../plugins/auth.js";
import { getRenderData } from "../cv-render-data/service.js";
import { renderCvDocumentToHtml } from "./render.js";
import { renderHtmlToPdf } from "./pdf.js";

export async function registerExportRoutes(app: FastifyInstance) {
  app.post("/cvs/:cvId/export", { preHandler: requireAuth }, async (req, reply) => {
    const { cvId } = req.params as { cvId: string };
    // Always computed fresh from current data — never cached (features/18).
    const data = await getRenderData(cvId, req.user!.id, req.user!.role);
    const html = renderCvDocumentToHtml(data);
    const { buffer, pageCount } = await renderHtmlToPdf(html);

    reply.header("Content-Type", "application/pdf");
    reply.header("X-Watermarked", String(data.watermarked));
    reply.header("X-Page-Count", String(pageCount));
    reply.header("Content-Disposition", 'attachment; filename="cv.pdf"');
    return reply.send(buffer);
  });
}
