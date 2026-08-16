import type { Subscription } from "@cv-maker/contracts";
import { db } from "../../db.js";
import { enumToDomain } from "../common/enum-map.js";
import type { Subscription as PrismaSubscription } from "../../../generated/client/index.js";

export function subscriptionToDomain(row: PrismaSubscription): Subscription {
  return {
    id: row.id,
    userId: row.userId,
    status: enumToDomain(row.status),
    stripeCustomerId: row.stripeCustomerId,
    stripeSubscriptionId: row.stripeSubscriptionId,
    currentPeriodEnd: row.currentPeriodEnd ? row.currentPeriodEnd.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function findSubscriptionByUserId(userId: string) {
  return db.subscription.findUnique({ where: { userId } });
}

export function findSubscriptionByStripeCustomerId(stripeCustomerId: string) {
  return db.subscription.findUnique({ where: { stripeCustomerId } });
}

export function findSubscriptionByStripeSubscriptionId(stripeSubscriptionId: string) {
  return db.subscription.findUnique({ where: { stripeSubscriptionId } });
}

/** Lazily provisions the `NONE`-status placeholder row a user needs before
 * we can attach a Stripe customer id to them at checkout time. */
export async function ensureSubscriptionRow(userId: string) {
  const existing = await findSubscriptionByUserId(userId);
  if (existing) return existing;
  return db.subscription.create({ data: { userId } });
}

export function setStripeCustomerId(id: string, stripeCustomerId: string) {
  return db.subscription.update({ where: { id }, data: { stripeCustomerId } });
}

export function applySubscriptionUpdate(
  id: string,
  data: {
    status?: "NONE" | "ACTIVE" | "CANCELED" | "PAST_DUE";
    stripeSubscriptionId?: string | null;
    currentPeriodEnd?: Date | null;
  },
) {
  return db.subscription.update({ where: { id }, data });
}
