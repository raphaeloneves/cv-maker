import type { CheckoutSessionResponse, CreateCheckoutSessionInput, Subscription } from "@cv-maker/contracts";
import { env } from "../../env.js";
import * as repo from "./repository.js";
import { getStripe } from "./stripe-client.js";

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const row = await repo.findSubscriptionByUserId(userId);
  return row ? repo.subscriptionToDomain(row) : null;
}

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  input: CreateCheckoutSessionInput,
): Promise<CheckoutSessionResponse> {
  const stripe = getStripe();
  const subscriptionRow = await repo.ensureSubscriptionRow(userId);

  let stripeCustomerId = subscriptionRow.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { userId },
    });
    stripeCustomerId = customer.id;
    await repo.setStripeCustomerId(subscriptionRow.id, stripeCustomerId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: { userId },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout session URL");
  }
  return { checkoutUrl: session.url };
}

/** `hasActiveEntitlement` (billing.ts) only cares about `status === 'active'`
 * — this maps every Stripe subscription status onto our smaller
 * `SubscriptionStatus` enum accordingly. */
export function mapStripeStatus(status: string): "NONE" | "ACTIVE" | "CANCELED" | "PAST_DUE" {
  switch (status) {
    case "active":
    case "trialing":
      return "ACTIVE";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "CANCELED";
    default:
      return "NONE";
  }
}

export async function applyStripeSubscriptionState(params: {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  currentPeriodEnd: number | null;
}): Promise<void> {
  const row = await repo.findSubscriptionByStripeCustomerId(params.stripeCustomerId);
  if (!row) return;
  await repo.applySubscriptionUpdate(row.id, {
    status: mapStripeStatus(params.status),
    stripeSubscriptionId: params.stripeSubscriptionId,
    currentPeriodEnd: params.currentPeriodEnd ? new Date(params.currentPeriodEnd * 1000) : null,
  });
}
