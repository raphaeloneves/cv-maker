import { db } from "../../db.js";
import { localeToDb, localeToDomain, enumToDomain } from "../common/enum-map.js";
import type { AuthUser, UserRole } from "@cv-maker/contracts";
import type { User } from "../../../generated/client/index.js";

export function userToAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    locale: localeToDomain(user.locale),
    role: enumToDomain<UserRole>(user.role),
    createdAt: user.createdAt.toISOString(),
  };
}

export function findUserByEmail(email: string) {
  return db.user.findUnique({ where: { email } });
}

export function findUserById(id: string) {
  return db.user.findUnique({ where: { id } });
}

export async function createUser(params: {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  locale: "pt-PT" | "en";
  acceptedTermsVersion: string;
}) {
  return db.user.create({
    data: {
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      passwordHash: params.passwordHash,
      locale: localeToDb(params.locale),
      termsAcceptances: { create: { version: params.acceptedTermsVersion } },
    },
  });
}

export function storeRefreshToken(params: { userId: string; tokenHash: string; expiresAt: Date }) {
  return db.refreshToken.create({
    data: { userId: params.userId, tokenHash: params.tokenHash, expiresAt: params.expiresAt },
  });
}

export function findRefreshTokenByHash(tokenHash: string) {
  return db.refreshToken.findUnique({ where: { tokenHash } });
}

export function revokeRefreshToken(id: string) {
  return db.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
}
