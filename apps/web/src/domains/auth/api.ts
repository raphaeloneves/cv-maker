import { apiPost, apiGet, apiPatch, setAccessToken } from "@/lib/api-client";
import type { SignUpInput, LogInInput, AuthSession, AuthUser, BuilderLocale } from "@cv-maker/contracts";

/** The exact terms/privacy revision the signup checkbox refers to. Recorded
 * verbatim as `acceptedTermsVersion` on the signup request — a real audit
 * record (features/16), not the reference product's implicit
 * "you continued so you agreed" pattern. Bump this whenever the linked
 * /terms or /privacy content materially changes. */
export const CURRENT_TERMS_VERSION = "2026-08-1";

export async function signUp(input: SignUpInput): Promise<AuthSession> {
  const session = await apiPost<AuthSession>("/auth/signup", input);
  setAccessToken(session.accessToken, session.accessTokenExpiresAt);
  return session;
}

export async function logIn(input: LogInInput): Promise<AuthSession> {
  const session = await apiPost<AuthSession>("/auth/login", input);
  setAccessToken(session.accessToken, session.accessTokenExpiresAt);
  return session;
}

export async function logOut(): Promise<void> {
  try {
    await apiPost<void>("/auth/logout");
  } finally {
    setAccessToken(null);
  }
}

export function fetchMe(): Promise<AuthUser> {
  return apiGet<AuthUser>("/auth/me");
}

/** Keeps `user.locale` (what cv-optimizer's `getAccountLocale()` uses to pick
 * the report/rewrite output language) in sync with the account settings
 * page's language switch — see AccountPage.tsx's `LocaleSwitch`. */
export function updateLocale(locale: BuilderLocale): Promise<AuthUser> {
  return apiPatch<AuthUser>("/auth/me", { locale });
}
