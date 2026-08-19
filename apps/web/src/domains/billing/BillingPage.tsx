import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { hasActiveEntitlement } from "@cv-maker/contracts";
import type { AuthUser } from "@cv-maker/contracts";
import { Button, Card } from "@/components/ui";
import { AppQueryProvider } from "@/lib/query-client";
import { RequireAuth } from "@/domains/auth/components/RequireAuth";
import { t } from "@/i18n";
import { useBuilderLocale } from "@/lib/use-builder-locale";
import { billingApi } from "./api.js";

/** Stripe's no-code Billing Portal login link — customers manage their own
 * subscription there directly on Stripe (update payment method, cancel,
 * change plans); we never build a bespoke "manage subscription" backend for
 * this, we just pick up whatever changed via the existing
 * `customer.subscription.*` webhook handlers (see billing/routes.ts). Same
 * override idiom as `PUBLIC_API_BASE_URL` in lib/api-client.ts: this
 * test-mode link is the dev default, swap in the live-mode portal link for
 * production via `PUBLIC_STRIPE_BILLING_PORTAL_URL`. */
const BILLING_PORTAL_URL =
  (import.meta.env.PUBLIC_STRIPE_BILLING_PORTAL_URL as string | undefined) ??
  "https://billing.stripe.com/p/login/test_dRmfZhbDr1hsgUG2hSdwc00";

function formatDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === "pt-PT" ? "pt-PT" : "en-GB", { dateStyle: "long" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function BillingBody({ user }: { user: AuthUser }) {
  const locale = useBuilderLocale();
  const [returnStatus, setReturnStatus] = useState<"success" | "cancel" | null>(null);
  const [starting, setStarting] = useState(false);

  const subscriptionQuery = useQuery({ queryKey: ["subscription"], queryFn: () => billingApi.getSubscription() });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (checkout === "success" || checkout === "cancel") {
      setReturnStatus(checkout);
      void subscriptionQuery.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subscription = subscriptionQuery.data ?? null;
  const entitled = hasActiveEntitlement(subscription, user.role);

  let statusText: string;
  if (user.role === "admin") {
    statusText = t(locale, "billing.current.admin");
  } else if (subscription?.status === "active") {
    statusText = t(locale, "billing.current.active").replace(
      "{date}",
      subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd, locale) : "—",
    );
  } else if (subscription?.status === "canceled") {
    statusText = t(locale, "billing.current.canceled").replace(
      "{date}",
      subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd, locale) : "—",
    );
  } else if (subscription?.status === "past_due") {
    statusText = t(locale, "billing.current.pastDue");
  } else {
    statusText = t(locale, "billing.current.free");
  }

  async function handleUpgrade() {
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
    <div className="mx-auto max-w-[90rem] px-5 py-10 sm:px-8">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-heading">{t(locale, "billing.title")}</h1>
      <p className="mt-1 text-sm text-text-muted">{t(locale, "billing.subtitle")}</p>

      {returnStatus === "success" && (
        <p className="mt-6 rounded-md bg-success/10 px-3 py-2 text-sm text-success">{t(locale, "checkout.returnSuccess")}</p>
      )}
      {returnStatus === "cancel" && (
        <p className="mt-6 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{t(locale, "checkout.returnCancel")}</p>
      )}

      <Card className="mt-6 flex flex-col gap-1 p-6">
        <span className="mono-label text-[10px] text-orange">
          {entitled ? t(locale, "nav.badge.pro") : t(locale, "pricing.free.name")}
        </span>
        <p className="text-sm font-medium text-heading">
          {subscriptionQuery.isLoading ? t(locale, "common.loading") : statusText}
        </p>
      </Card>

      {!entitled && (
        <Card className="mt-4 flex flex-col gap-3 p-6">
          <div>
            <h2 className="font-display text-lg font-bold text-heading">{t(locale, "billing.upgrade.title")}</h2>
            <p className="mt-1 text-sm text-text-muted">{t(locale, "billing.upgrade.body")}</p>
          </div>
          <p className="text-2xl font-extrabold text-heading">
            {t(locale, "pricing.pro.price")} <span className="text-sm font-medium text-text-muted">{t(locale, "pricing.pro.period")}</span>
          </p>
          <Button onClick={handleUpgrade} loading={starting} size="lg" className="self-start">
            {starting ? t(locale, "billing.upgrade.starting") : t(locale, "billing.upgrade.cta")}
          </Button>
        </Card>
      )}

      {subscription && (
        <Card className="mt-4 flex flex-col gap-3 p-6">
          <div>
            <h2 className="font-display text-lg font-bold text-heading">{t(locale, "billing.manage.title")}</h2>
            <p className="text-sm text-text-muted">{t(locale, "billing.manage.body")}</p>
          </div>
          <Button
            variant="secondary"
            size="lg"
            className="self-start"
            onClick={() => (window.location.href = BILLING_PORTAL_URL)}
          >
            {t(locale, "billing.manage.cta")}
          </Button>
        </Card>
      )}
    </div>
  );
}

/** `/billing` — the authenticated app shell's billing page. Reuses the same
 * `GET /billing/subscription` + `hasActiveEntitlement()` the Checkout
 * builder step already relies on (see `CheckoutPage.tsx`), so plan status
 * shown here can never disagree with what actually gates exports. Plan
 * management beyond upgrading (payment method, self-serve cancel) is Stripe's
 * own Billing Portal, not a bespoke flow here — see BILLING_PORTAL_URL. */
export function BillingPage() {
  return (
    <AppQueryProvider>
      <RequireAuth>{(user) => <BillingBody user={user} />}</RequireAuth>
    </AppQueryProvider>
  );
}
