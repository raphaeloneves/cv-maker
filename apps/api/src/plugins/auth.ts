import type { FastifyReply, FastifyRequest } from "fastify";
import type { UserRole } from "@cv-maker/contracts";
import { unauthorized } from "../errors.js";
import { verifyAccessToken } from "../modules/auth/tokens.js";

export interface RequestUser {
  id: string;
  role: UserRole;
  email: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: RequestUser;
  }
}

/** Fastify `preHandler` — verifies the `Authorization: Bearer <token>` access
 * token and attaches the decoded identity to `req.user`. Every route except
 * `POST /auth/*` and `GET /health` requires this (see docs/api-routes.md). */
export async function requireAuth(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw unauthorized("Missing or malformed Authorization header");
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = await verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
  } catch {
    throw unauthorized("Invalid or expired access token");
  }
}
