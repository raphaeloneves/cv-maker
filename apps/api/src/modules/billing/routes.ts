import type { FastifyInstance } from "fastify";
import Stripe from "stripe";
import { createCheckoutSessionSchema } from "@cv-maker/contracts";
import { requireAuth } from "../../plugins/auth.js";
import { badRequest } from "../../errors.js";
import { env } from "../../env.js";
import * as service from "./service.js";
import { getStripe } from "./stripe-client.js";

export async function registerBillingRoutes(app: FastifyInstance) {
  app.get("/billing/subscription", { preHandler: requireAuth }, async (req) => {
    return service.getSubscription(req.user!.id);
  });

  app.post("/billing/checkout-session", { preHandler: requireAuth }, async (req) => {
    const input = createCheckoutSessionSchema.parse(req.body);
    return service.createCheckoutSession(req.user!.id, req.user!.email, input);
  });

  // Stripe webhook signature verification needs the exact raw request bytes,
  // not Fastify's default JSON-parsed body — this nested plugin scopes a
  // buffer-mode content-type parser to just this one route (Fastify's
  // encapsulation model keeps it from affecting every other JSON route).
  await app.register(async (scoped) => {
    scoped.addContentTypeParser(
      "application/json",
      { parseAs: "buffer" },
      (_req, body, done) => done(null, body),
    );

    scoped.post("/billing/webhook", async (req, reply) => {
      const signature = req.headers["stripe-signature"];
      if (typeof signature !== "string") {
        throw badRequest("Missing Stripe-Signature header");
      }
      let event: Stripe.Event;
      try {
        event = getStripe().webhooks.constructEvent(
          req.body as Buffer,
          signature,
          env.STRIPE_WEBHOOK_SECRET,
        );
      } catch (err) {
        throw badRequest(`Invalid Stripe webhook signature: ${(err as Error).message}`);
      }

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          if (typeof session.customer === "string" && typeof session.subscription === "string") {
            const sub = await getStripe().subscriptions.retrieve(session.subscription);
            await service.applyStripeSubscriptionState({
              stripeCustomerId: session.customer,
              stripeSubscriptionId: sub.id,
              status: sub.status,
              currentPeriodEnd: sub.current_period_end,
            });
          }
          break;
        }
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          if (typeof sub.customer === "string") {
            await service.applyStripeSubscriptionState({
              stripeCustomerId: sub.customer,
              stripeSubscriptionId: sub.id,
              status: sub.status,
              currentPeriodEnd: sub.current_period_end,
            });
          }
          break;
        }
        default:
          break;
      }

      reply.code(200);
      return { received: true };
    });
  });
}
