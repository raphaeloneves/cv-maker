import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./env.js";

// PLACEHOLDER entry point — real module registration (auth, cvs, sections,
// uploads, templates, billing, export) lands here per the build sequence in
// /Users/rneves/.claude/plans/calm-enchanting-wilkes.md.

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: env.WEB_ORIGIN,
  credentials: true,
});

app.get("/health", async () => ({ status: "ok" }));

app
  .listen({ port: env.API_PORT, host: "0.0.0.0" })
  .then(() => app.log.info(`api listening on :${env.API_PORT}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
