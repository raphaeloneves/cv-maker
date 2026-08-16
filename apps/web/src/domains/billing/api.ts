import { apiGet, apiPost } from "@/lib/api-client";
import type { CheckoutSessionResponse, CreateCheckoutSessionInput, Subscription } from "@cv-maker/contracts";

/** See docs/api-routes.md "Billing". */
export const billingApi = {
  getSubscription: () => apiGet<Subscription | null>(`/billing/subscription`),
  createCheckoutSession: (body: CreateCheckoutSessionInput) =>
    apiPost<CheckoutSessionResponse>(`/billing/checkout-session`, body),
};
