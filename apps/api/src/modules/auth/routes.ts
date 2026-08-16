import type { FastifyInstance } from "fastify";
import { logInSchema, signUpSchema } from "@cv-maker/contracts";
import { requireAuth } from "../../plugins/auth.js";
import * as service from "./service.js";
import { REFRESH_COOKIE_NAME, refreshTokenExpiry } from "./tokens.js";

function setRefreshCookie(reply: import("fastify").FastifyReply, token: string) {
  reply.setCookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    expires: refreshTokenExpiry(),
  });
}

function clearRefreshCookie(reply: import("fastify").FastifyReply) {
  reply.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/auth/signup", async (req, reply) => {
    const input = signUpSchema.parse(req.body);
    const { session, refreshToken } = await service.signUp(input);
    setRefreshCookie(reply, refreshToken);
    reply.code(201);
    return session;
  });

  app.post("/auth/login", async (req, reply) => {
    const input = logInSchema.parse(req.body);
    const { session, refreshToken } = await service.logIn(input);
    setRefreshCookie(reply, refreshToken);
    return session;
  });

  app.post("/auth/refresh", async (req, reply) => {
    const presented = req.cookies[REFRESH_COOKIE_NAME];
    const { session, refreshToken } = await service.refresh(presented);
    setRefreshCookie(reply, refreshToken);
    return session;
  });

  app.post("/auth/logout", async (req, reply) => {
    const presented = req.cookies[REFRESH_COOKIE_NAME];
    await service.logOut(presented);
    clearRefreshCookie(reply);
    reply.code(204);
    return null;
  });

  app.get("/auth/me", { preHandler: requireAuth }, async (req) => {
    return service.me(req.user!.id);
  });
}
