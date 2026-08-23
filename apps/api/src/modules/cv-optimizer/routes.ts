import type { FastifyInstance } from "fastify";
import {
  ACCEPTED_CV_UPLOAD_MIME_TYPES,
  createCvOptimizerReportFromUploadSchema,
  createCvOptimizerReportSchema,
  MAX_CV_UPLOAD_BYTES,
} from "@cv-maker/contracts";
import { requireAuth } from "../../plugins/auth.js";
import { badRequest } from "../../errors.js";
import { extractTextFromPdf } from "./pdf-text.js";
import * as service from "./service.js";

export async function registerCvOptimizerRoutes(app: FastifyInstance) {
  app.get("/cv-optimizer/reports", { preHandler: requireAuth }, async (req) => {
    return service.listReports(req.user!.id);
  });

  app.get("/cv-optimizer/reports/:id", { preHandler: requireAuth }, async (req) => {
    const { id } = req.params as { id: string };
    return service.getReport(id, req.user!.id);
  });

  app.post("/cv-optimizer/reports", { preHandler: requireAuth }, async (req, reply) => {
    const input = createCvOptimizerReportSchema.parse(req.body);
    const report = await service.createReport(req.user!.id, req.user!.role, input);
    reply.code(201);
    return report;
  });

  // Multipart, not JSON: the CV arrives as an uploaded PDF part alongside
  // the same text fields as the JSON route above (minus cvId, which doesn't
  // apply here). `req.parts()` rather than `req.file()` + `attachFieldsToBody`
  // since this request mixes one file with several plain fields.
  app.post("/cv-optimizer/reports/upload", { preHandler: requireAuth }, async (req, reply) => {
    const fields: Record<string, string> = {};
    let cvFile: { fileName: string; buffer: Buffer } | null = null;

    for await (const part of req.parts({ limits: { fileSize: MAX_CV_UPLOAD_BYTES } })) {
      if (part.type === "file") {
        if (part.fieldname !== "cvFile") continue;
        if (!ACCEPTED_CV_UPLOAD_MIME_TYPES.includes(part.mimetype as (typeof ACCEPTED_CV_UPLOAD_MIME_TYPES)[number])) {
          throw badRequest("Only PDF files are accepted for an uploaded CV.", { cvFile: "unsupported_type" });
        }
        const buffer = await part.toBuffer();
        if (buffer.byteLength > MAX_CV_UPLOAD_BYTES) {
          throw badRequest("The uploaded CV exceeds the maximum allowed size.", { cvFile: "too_large" });
        }
        cvFile = { fileName: part.filename, buffer };
      } else {
        fields[part.fieldname] = String(part.value);
      }
    }

    if (!cvFile) throw badRequest("No CV file was uploaded.", { cvFile: "required" });

    const input = createCvOptimizerReportFromUploadSchema.parse(fields);
    const text = await extractTextFromPdf(cvFile.buffer);
    const report = await service.createReportFromUpload(req.user!.id, req.user!.role, input, {
      fileName: cvFile.fileName,
      text,
    });
    reply.code(201);
    return report;
  });

  // No body — retries generation with the exact inputs already stored on
  // the report (see service.ts's retryReport). Only valid while status is
  // "failed"; poll GET .../reports/:id same as the original generation.
  app.post("/cv-optimizer/reports/:id/retry", { preHandler: requireAuth }, async (req) => {
    const { id } = req.params as { id: string };
    return service.retryReport(id, req.user!.id, req.user!.role);
  });

  // No body — everything the rewrite needs (role, job description, the
  // report's own findings, which CV to base it on) already lives on the
  // report itself. Returns the report (its rewriteStatus now "pending");
  // poll GET .../reports/:id same as the report generation itself.
  app.post("/cv-optimizer/reports/:id/rewrite", { preHandler: requireAuth }, async (req) => {
    const { id } = req.params as { id: string };
    return service.createRewrite(id, req.user!.id, req.user!.role);
  });
}
