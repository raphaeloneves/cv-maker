import { z } from "zod";
import { subscriptionStatusSchema, userRoleSchema } from "./enums.js";

/** features/19-pricing-account-paywall.md. We ship freemium, not the reference
 * product's hard paywall: `subscription.status === 'active'` is what gates
 * watermark removal + premium templates at export time — everything else in
 * the builder (all sections, all templates browsable, all free exports) is
 * available with no subscription at all. */
export const subscriptionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  status: subscriptionStatusSchema,
  stripeCustomerId: z.string().nullable(),
  stripeSubscriptionId: z.string().nullable(),
  currentPeriodEnd: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Subscription = z.infer<typeof subscriptionSchema>;

export const createCheckoutSessionSchema = z.object({
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});
export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;

export const checkoutSessionResponseSchema = z.object({
  checkoutUrl: z.string().url(),
});
export type CheckoutSessionResponse = z.infer<typeof checkoutSessionResponseSchema>;

/** `admin` accounts (see enums.ts:userRoleSchema) always have an entitlement,
 * regardless of subscription state — this is the internal QA/demo bypass,
 * never surfaced as a purchasable option. */
export function hasActiveEntitlement(
  subscription: Subscription | null,
  userRole: z.infer<typeof userRoleSchema>,
): boolean {
  if (userRole === "admin") return true;
  return subscription?.status === "active";
}
