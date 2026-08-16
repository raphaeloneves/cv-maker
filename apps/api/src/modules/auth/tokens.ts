import { randomBytes, createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@cv-maker/contracts";
import { env } from "../../env.js";

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  email: string;
}

export async function signAccessToken(
  payload: AccessTokenPayload,
): Promise<{ token: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + env.ACCESS_TOKEN_TTL_MINUTES * 60_000);
  const token = await new SignJWT({ role: payload.role, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(accessSecret);
  return { token, expiresAt };
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret);
  return {
    sub: payload.sub as string,
    role: payload.role as UserRole,
    email: payload.email as string,
  };
}

/** Refresh tokens are opaque random strings, never JWTs — only their SHA-256
 * hash is ever persisted (see RefreshToken.tokenHash), so a DB read alone
 * never discloses a usable token. */
export function generateRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function refreshTokenExpiry(): Date {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60_000);
}

export const REFRESH_COOKIE_NAME = "cv_maker_refresh";
