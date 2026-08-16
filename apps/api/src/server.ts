import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import { ZodError } from "zod";
import { env } from "./env.js";
import { AppError } from "./errors.js";
import { registerAuthRoutes } from "./modules/auth/routes.js";
import { registerCvRoutes } from "./modules/cvs/routes.js";
import { registerPersonalInfoRoutes } from "./modules/personal-info/routes.js";
import { registerSectionRoutes } from "./modules/sections/routes.js";
import { registerFreeformSectionRoutes } from "./modules/sections/freeform-routes.js";
import { registerEntryRoutesForAllKinds } from "./modules/sections/entries/index.js";
import { registerTemplateRoutes } from "./modules/templates/routes.js";
import { registerCvRenderDataRoutes } from "./modules/cv-render-data/routes.js";
import { registerExportRoutes } from "./modules/export/routes.js";
import { registerBillingRoutes } from "./modules/billing/routes.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: env.WEB_ORIGIN,
  credentials: true,
});

await app.register(cookie);
await app.register(multipart);

/** Canonical error shape for every 4xx/5xx response (docs/api-routes.md):
 * `{ error: { code, message, fields? } }`. Converts our own `AppError`s,
 * zod validation failures (both raw `ZodError`s from manual `.parse()` calls
 * and Fastify's own `FST_ERR_VALIDATION` wrapper), and falls back to a
 * generic 500 for anything unexpected.
 *
 * Registered BEFORE any routes: Fastify snapshots the current error/
 * not-found handler onto each route's context at the moment that route is
 * declared, so setting these afterward would silently not apply to routes
 * already registered above them. */
app.setErrorHandler((err, _req, reply) => {
  if (err instanceof AppError) {
    reply.code(err.statusCode).send({
      error: { code: err.code, message: err.message, ...(err.fields ? { fields: err.fields } : {}) },
    });
    return;
  }

  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      fields[issue.path.join(".") || "(root)"] = issue.message;
    }
    reply.code(400).send({
      error: { code: "VALIDATION_ERROR", message: "Request validation failed", fields },
    });
    return;
  }

  if ((err as { validation?: unknown[] }).validation) {
    const fields: Record<string, string> = {};
    for (const issue of (err as { validation: { instancePath?: string; message?: string }[] })
      .validation) {
      fields[issue.instancePath || "(root)"] = issue.message ?? "invalid";
    }
    reply.code(400).send({
      error: { code: "VALIDATION_ERROR", message: "Request validation failed", fields },
    });
    return;
  }

  const fallback = err as { statusCode?: number; message?: string };
  const statusCode = fallback.statusCode && fallback.statusCode >= 400 ? fallback.statusCode : 500;
  app.log.error(err);
  reply.code(statusCode).send({
    error: {
      code: statusCode === 500 ? "INTERNAL_ERROR" : "ERROR",
      message: statusCode === 500 ? "Internal server error" : (fallback.message ?? "Error"),
    },
  });
});

app.setNotFoundHandler((_req, reply) => {
  reply.code(404).send({ error: { code: "NOT_FOUND", message: "Route not found" } });
});

app.get("/health", async () => ({ status: "ok" }));

await registerAuthRoutes(app);
await registerCvRoutes(app);
await registerPersonalInfoRoutes(app);
await registerSectionRoutes(app);
await registerFreeformSectionRoutes(app);
await registerEntryRoutesForAllKinds(app);
await registerTemplateRoutes(app);
await registerCvRenderDataRoutes(app);
await registerExportRoutes(app);
await registerBillingRoutes(app);

app
  .listen({ port: env.API_PORT, host: "0.0.0.0" })
  .then(() => app.log.info(`api listening on :${env.API_PORT}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
