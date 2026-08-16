import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { hasActiveEntitlement } from "@cv-maker/contracts";
import type { UserRole } from "@cv-maker/contracts";
import { Button, Card } from "@/components/ui";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";
import { CheckIcon } from "@/domains/sections/icons.js";
import { ExportButton } from "@/domains/export/ExportButton.js";
import { billingApi } from "./api.js";

const BENEFIT_KEYS = ["removeWatermark", "premiumTemplates", "unlimitedCvs", "cancelAnytime"];

/** `/builder/checkout` — the honest 4th stepper step. Real Stripe Checkout
 * redirect via `POST /billing/checkout-session`, success/cancel return
 * handling via a `?checkout=success|cancel` round-trip param, and current
 * entitlement display via `GET /billing/subscription` +
 * `hasActiveEntitlement()`. `userRole` is threaded down from
 * `RequireAuth`'s already-resolved session (see CheckoutPageIsland.tsx)
 * rather than re-fetched here. See features/19-pricing-account-paywall.md. */
export function CheckoutPage({ cvId, cvTitle, userRole }: { cvId: string; cvTitle: string; userRole: UserRole }) {
  const locale = useBuilderLocale();
  const [returnStatus, setReturnStatus] = useState<"success" | "cancel" | null>(null);
  const [starting, setStarting] = useState(false);

  const subscriptionQuery = useQuery({
    queryKey: ["subscription"],
    queryFn: () => billingApi.getSubscription(),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (checkout === "success" || checkout === "cancel") {
      setReturnStatus(checkout);
      void subscriptionQuery.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entitled = hasActiveEntitlement(subscriptionQuery.data ?? null, userRole);

  async function handleCheckout() {
    setStarting(true);
    try {
      const successUrl = new URL(window.location.href);
      successUrl.searchParams.set("checkout", "success");
      const cancelUrl = new URL(window.location.href);
      cancelUrl.searchParams.set("checkout", "cancel");
      const session = await billingApi.createCheckoutSession({
        successUrl: successUrl.toString(),
        cancelUrl: cancelUrl.toString(),
      });
      window.location.href = session.checkoutUrl;
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="flex flex-col gap-4 p-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-heading">{t(locale, "checkout.heading")}</h2>
          <p className="mt-1 text-sm text-text-muted">{t(locale, "checkout.subheading")}</p>
        </div>

        {returnStatus === "success" && (
          <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">{t(locale, "checkout.returnSuccess")}</p>
        )}
        {returnStatus === "cancel" && (
          <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{t(locale, "checkout.returnCancel")}</p>
        )}

        <ul className="flex flex-col gap-2 text-sm text-body">
          {BENEFIT_KEYS.map((key) => (
            <li key={key} className="flex items-start gap-2">
              <CheckIcon className="mt-0.5 shrink-0 text-success" />
              <span>{t(locale, `checkout.benefit.${key}`)}</span>
            </li>
          ))}
        </ul>

        {entitled ? (
          <p className="rounded-md bg-orange/10 px-3 py-2 text-sm font-medium text-orange">
            {t(locale, "checkout.alreadyEntitled")}
          </p>
        ) : (
          <Button onClick={handleCheckout} loading={starting} size="lg">
            {t(locale, "checkout.subscribe")}
          </Button>
        )}

        <p className="text-xs text-text-muted">{t(locale, "checkout.legalNotice")}</p>
      </Card>

      <Card className="flex flex-col gap-4 p-6">
        <h3 className="font-display text-lg font-bold text-heading">{t(locale, "checkout.exportHeading")}</h3>
        <p className="text-sm text-text-muted">{t(locale, "checkout.exportSubheading")}</p>
        <ExportButton cvId={cvId} cvTitle={cvTitle} />
      </Card>
    </div>
  );
}
