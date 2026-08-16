import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { ACCEPTED_PHOTO_MIME_TYPES, MAX_PHOTO_BYTES, updatePersonalInfoSchema } from "@cv-maker/contracts";
import { requireAuth } from "../../plugins/auth.js";
import { badRequest } from "../../errors.js";
import { getOwnedCv } from "../cvs/service.js";
import { deleteObject, keyFromPublicUrl, putObject } from "../uploads/s3.js";
import * as personalInfoRepo from "./repository.js";
import * as service from "./service.js";

export async function registerPersonalInfoRoutes(app: FastifyInstance) {
  app.get("/cvs/:cvId/personal-info", { preHandler: requireAuth }, async (req) => {
    const { cvId } = req.params as { cvId: string };
    await getOwnedCv(cvId, req.user!.id);
    return service.getPersonalInfo(cvId);
  });

  app.put("/cvs/:cvId/personal-info", { preHandler: requireAuth }, async (req) => {
    const { cvId } = req.params as { cvId: string };
    await getOwnedCv(cvId, req.user!.id);
    const input = updatePersonalInfoSchema.parse(req.body);
    return service.upsertPersonalInfo(cvId, input);
  });

  app.post("/cvs/:cvId/personal-info/photo", { preHandler: requireAuth }, async (req) => {
    const { cvId } = req.params as { cvId: string };
    await getOwnedCv(cvId, req.user!.id);

    const file = await req.file({ limits: { fileSize: MAX_PHOTO_BYTES } });
    if (!file) throw badRequest("No photo file provided");
    if (!ACCEPTED_PHOTO_MIME_TYPES.includes(file.mimetype as (typeof ACCEPTED_PHOTO_MIME_TYPES)[number])) {
      throw badRequest("Unsupported photo file type — only jpg/jpeg/png are accepted", {
        photo: "unsupported_type",
      });
    }
    const buffer = await file.toBuffer();
    if (buffer.byteLength > MAX_PHOTO_BYTES) {
      throw badRequest("Photo exceeds the maximum allowed size", { photo: "too_large" });
    }

    const existing = await personalInfoRepo.findPersonalInfoByCv(cvId);
    const extension = file.mimetype === "image/png" ? "png" : "jpg";
    const key = `personal-info/${cvId}/${randomUUID()}.${extension}`;
    const photoUrl = await putObject({ key, body: buffer, contentType: file.mimetype });

    const previousKey = existing?.photoUrl ? keyFromPublicUrl(existing.photoUrl) : null;

    if (existing) {
      await personalInfoRepo.setPersonalInfoPhotoUrl(cvId, photoUrl);
    } else {
      // A photo may be the very first thing saved — provision a minimal row;
      // required contact fields still get enforced by the PUT endpoint before
      // the CV is considered "complete."
      await personalInfoRepo.createPersonalInfo(cvId, {
        firstName: "",
        lastName: "",
        email: "",
        address: "",
        photoUrl,
      });
    }

    if (previousKey) {
      await deleteObject(previousKey).catch(() => undefined);
    }

    return { photoUrl };
  });

  app.delete("/cvs/:cvId/personal-info/photo", { preHandler: requireAuth }, async (req, reply) => {
    const { cvId } = req.params as { cvId: string };
    await getOwnedCv(cvId, req.user!.id);
    const existing = await personalInfoRepo.findPersonalInfoByCv(cvId);
    if (existing?.photoUrl) {
      const key = keyFromPublicUrl(existing.photoUrl);
      await personalInfoRepo.clearPersonalInfoPhoto(cvId);
      if (key) await deleteObject(key).catch(() => undefined);
    }
    reply.code(204);
    return null;
  });
}
