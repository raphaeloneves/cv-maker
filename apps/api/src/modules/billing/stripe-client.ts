import Stripe from "stripe";
import { env } from "../../env.js";

let stripe: Stripe | null = null;

/** Lazily constructs the Stripe SDK client on first use — never at module
 * load / server boot — so a placeholder `STRIPE_SECRET_KEY` (as shipped in
 * dev `.env`) never crashes startup. Only a billing route that actually
 * calls this throws, and only when it does. */
export function getStripe(): Stripe {
  if (!stripe) {
    stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });
  }
  return stripe;
}
