import { z } from "zod";
import { builderLocaleSchema, userRoleSchema } from "./enums.js";

/** `user.email` is intentionally a separate column from `personal_info.email`
 * (features/19) — the UI may default one from the other, but they are never
 * the same column, since a professional CV contact email and a personal
 * account/billing email are legitimately allowed to differ. */
export const signUpSchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(10).max(200),
  // No `.default(...)` here on purpose: the frontend always sends this
  // explicitly, seeded from the site's own current language (see
  // apps/web SignupForm.tsx / getStoredLocale()) — a silent "pt-PT" fallback
  // here would only ever mask a future caller (an admin tool, a script, a
  // new signup variant) forgetting to pass it, landing that account on
  // Portuguese with no error and no visible sign anything was wrong.
  locale: builderLocaleSchema,
  /** Recorded as an audit record (accepted + timestamp + terms version), not
   * just an implicit "you continued so you agreed" pattern — see features/16's
   * flag that the reference product's implicit-consent pattern needs LGPD/legal
   * review before reuse. */
  acceptedTermsVersion: z.string().min(1),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

/** Body for `PATCH /auth/me` — the account settings page's language switch
 * (see apps/web AccountPage.tsx) updates this alongside the client-only
 * `builderUiLocale` preference, so the two never drift apart: this is the
 * same `user.locale` column `getAccountLocale()` reads in cv-optimizer's
 * service.ts to decide what language Claude writes reports/rewrites in. */
export const updateLocaleSchema = z.object({
  locale: builderLocaleSchema,
});
export type UpdateLocaleInput = z.infer<typeof updateLocaleSchema>;

export const logInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});
export type LogInInput = z.infer<typeof logInSchema>;

export const authUserSchema = z.object({
  id: z.string().uuid(),
  // Account identity, distinct from PersonalInfo.firstName/lastName (see
  // that schema's own comment) — blank ("") for accounts created before this
  // field existed, never null, so callers can render it directly and fall
  // back to `email` when empty rather than null-checking everywhere.
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  locale: builderLocaleSchema,
  role: userRoleSchema,
  createdAt: z.string().datetime(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

/** Returned on login/signup/refresh. `accessToken` is short-lived and held in
 * memory client-side; the refresh token is set as an httpOnly, SameSite=None,
 * Secure cookie by the server — never returned in the JSON body. */
export const authSessionSchema = z.object({
  accessToken: z.string(),
  accessTokenExpiresAt: z.string().datetime(),
  user: authUserSchema,
});
export type AuthSession = z.infer<typeof authSessionSchema>;
