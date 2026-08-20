import argon2 from "argon2";
import type { AuthSession, AuthUser, LogInInput, SignUpInput, UpdateLocaleInput } from "@cv-maker/contracts";
import { AppError, badRequest, unauthorized } from "../../errors.js";
import * as repo from "./repository.js";
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiry,
  signAccessToken,
} from "./tokens.js";

async function issueSession(user: { id: string; email: string; role: "USER" | "ADMIN" }) {
  const { token: accessToken, expiresAt } = await signAccessToken({
    sub: user.id,
    role: user.role === "ADMIN" ? "admin" : "user",
    email: user.email,
  });
  const refreshToken = generateRefreshToken();
  await repo.storeRefreshToken({
    userId: user.id,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: refreshTokenExpiry(),
  });
  return { accessToken, accessTokenExpiresAt: expiresAt, refreshToken };
}

export async function signUp(
  input: SignUpInput,
): Promise<{ session: AuthSession; refreshToken: string }> {
  const existing = await repo.findUserByEmail(input.email);
  if (existing) {
    throw new AppError(409, "EMAIL_TAKEN", "An account with this email already exists", {
      email: "already registered",
    });
  }
  const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
  const user = await repo.createUser({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    passwordHash,
    locale: input.locale,
    acceptedTermsVersion: input.acceptedTermsVersion,
  });
  const { accessToken, accessTokenExpiresAt, refreshToken } = await issueSession(user);
  return {
    session: {
      accessToken,
      accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
      user: repo.userToAuthUser(user),
    },
    refreshToken,
  };
}

export async function logIn(
  input: LogInInput,
): Promise<{ session: AuthSession; refreshToken: string }> {
  const user = await repo.findUserByEmail(input.email);
  if (!user) throw unauthorized("Invalid email or password");
  const valid = await argon2.verify(user.passwordHash, input.password);
  if (!valid) throw unauthorized("Invalid email or password");
  const { accessToken, accessTokenExpiresAt, refreshToken } = await issueSession(user);
  return {
    session: {
      accessToken,
      accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
      user: repo.userToAuthUser(user),
    },
    refreshToken,
  };
}

export async function refresh(
  presentedToken: string | undefined,
): Promise<{ session: AuthSession; refreshToken: string }> {
  if (!presentedToken) throw unauthorized("Missing refresh token");
  const tokenHash = hashRefreshToken(presentedToken);
  const stored = await repo.findRefreshTokenByHash(tokenHash);
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw unauthorized("Invalid or expired refresh token");
  }
  const user = await repo.findUserById(stored.userId);
  if (!user) throw unauthorized("Invalid refresh token");

  // Rotate: revoke the presented token, issue a brand new one.
  await repo.revokeRefreshToken(stored.id);
  const { accessToken, accessTokenExpiresAt, refreshToken } = await issueSession(user);
  return {
    session: {
      accessToken,
      accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
      user: repo.userToAuthUser(user),
    },
    refreshToken,
  };
}

export async function logOut(presentedToken: string | undefined): Promise<void> {
  if (!presentedToken) return;
  const stored = await repo.findRefreshTokenByHash(hashRefreshToken(presentedToken));
  if (stored && !stored.revokedAt) {
    await repo.revokeRefreshToken(stored.id);
  }
}

export async function me(userId: string) {
  const user = await repo.findUserById(userId);
  if (!user) throw badRequest("User no longer exists");
  return repo.userToAuthUser(user);
}

/** Backs the account settings page's language switch — keeps `user.locale`
 * (what cv-optimizer's `getAccountLocale()` uses to pick the report/rewrite
 * output language) in sync with the UI chrome locale the user actually
 * selects, instead of that switch staying a client-only `localStorage` toggle. */
export async function updateLocale(userId: string, input: UpdateLocaleInput): Promise<AuthUser> {
  const user = await repo.updateUserLocale(userId, input.locale);
  return repo.userToAuthUser(user);
}
