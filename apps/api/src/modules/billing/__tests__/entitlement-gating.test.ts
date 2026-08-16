import { describe, expect, it } from "vitest";
import { hasActiveEntitlement } from "@cv-maker/contracts";
import type { Subscription } from "@cv-maker/contracts";
import { mapStripeStatus } from "../service.js";

function subscription(status: Subscription["status"]): Subscription {
  return {
    id: "sub-1",
    userId: "user-1",
    status,
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: "sub_1",
    currentPeriodEnd: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("watermark / export entitlement gating", () => {
  it("admin role always bypasses the paywall, regardless of subscription state", () => {
    expect(hasActiveEntitlement(null, "admin")).toBe(true);
    expect(hasActiveEntitlement(subscription("canceled"), "admin")).toBe(true);
    expect(hasActiveEntitlement(subscription("past_due"), "admin")).toBe(true);
  });

  it("a regular user with no subscription row is not entitled (export is watermarked)", () => {
    expect(hasActiveEntitlement(null, "user")).toBe(false);
  });

  it("a regular user is entitled only while status is exactly 'active'", () => {
    expect(hasActiveEntitlement(subscription("active"), "user")).toBe(true);
    expect(hasActiveEntitlement(subscription("none"), "user")).toBe(false);
    expect(hasActiveEntitlement(subscription("canceled"), "user")).toBe(false);
    expect(hasActiveEntitlement(subscription("past_due"), "user")).toBe(false);
  });

  it("maps every relevant Stripe subscription status onto our smaller status enum", () => {
    expect(mapStripeStatus("active")).toBe("ACTIVE");
    expect(mapStripeStatus("trialing")).toBe("ACTIVE");
    expect(mapStripeStatus("past_due")).toBe("PAST_DUE");
    expect(mapStripeStatus("unpaid")).toBe("PAST_DUE");
    expect(mapStripeStatus("canceled")).toBe("CANCELED");
    expect(mapStripeStatus("incomplete_expired")).toBe("CANCELED");
    expect(mapStripeStatus("incomplete")).toBe("NONE");
  });

  it("round-trips mapStripeStatus through hasActiveEntitlement for a webhook-driven 'active' update", () => {
    // Guards the exact seam export/render-data relies on: after a webhook
    // sets status via mapStripeStatus, hasActiveEntitlement must read it as
    // entitled for a plain user (lowercased at the contracts boundary).
    const mapped = mapStripeStatus("active"); // "ACTIVE"
    const domainStatus = mapped.toLowerCase() as Subscription["status"];
    expect(hasActiveEntitlement(subscription(domainStatus), "user")).toBe(true);
  });
});
