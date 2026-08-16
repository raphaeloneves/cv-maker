import { z } from "zod";
import { builderLocaleSchema, userRoleSchema } from "./enums.js";

/** `user.email` is intentionally a separate column from `personal_info.email`
 * (features/19) — the UI may default one from the other, but they are never
 * the same column, since a professional CV contact email and a personal
 * account/billing email are legitimately allowed to differ. */
export const signUpSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(10).max(200),
  locale: builderLocaleSchema.default("pt-PT"),
  /** Recorded as an audit record (accepted + timestamp + terms version), not
   * just an implicit "you continued so you agreed" pattern — see features/16's
   * flag that the reference product's implicit-consent pattern needs LGPD/legal
   * review before reuse. */
  acceptedTermsVersion: z.string().min(1),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const logInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});
export type LogInInput = z.infer<typeof logInSchema>;

export const authUserSchema = z.object({
  id: z.string().uuid(),
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
