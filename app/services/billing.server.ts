import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";

export const PLANS = {
    pro: {
        name: "pro",
        displayName: "Pro Plan",
        price: 9.99,
        interval: "EVERY_30_DAYS" as const,
        trialDays: 7,
        features: [
            "Save up to Infinity wishlist items",
            "Simple wishlist management",
            "Mobile friendly",
            "Fast access",
            "Email alerts for price changes",
            "Email alerts for stock changes",
            "Custom button configuration",
        ],
    },
} as const;

export type PlanKey = keyof typeof PLANS;

const SUBSCRIPTION_CREATE = `
  mutation appSubscriptionCreate(
    $name: String!
    $lineItems: [AppSubscriptionLineItemInput!]!
    $returnUrl: URL!
    $trialDays: Int
    $test: Boolean
  ) {
    appSubscriptionCreate(
      name: $name
      lineItems: $lineItems
      returnUrl: $returnUrl
      trialDays: $trialDays
      test: $test
    ) {
      userErrors { field message }
      confirmationUrl
      appSubscription { id status }
    }
  }
`;

const ACTIVE_SUBSCRIPTION_QUERY = `
  query {
    currentAppInstallation {
      activeSubscriptions {
        id
        name
        status
        createdAt
        currentPeriodEnd
        trialDays
        lineItems {
          plan {
            pricingDetails {
              ... on AppRecurringPricing {
                price { amount currencyCode }
                interval
              }
            }
          }
        }
      }
    }
  }
`;

const SUBSCRIPTION_CANCEL = `
  mutation appSubscriptionCancel($id: ID!) {
    appSubscriptionCancel(id: $id) {
      userErrors { field message }
      appSubscription { id status }
    }
  }
`;

const SHOP_PLAN_QUERY = `
  query {
    shop { plan { partnerDevelopment } }
  }
`;

// Partner development stores (demo/test stores) use the app free with full
// Pro features. Only real (live) stores have to subscribe.
async function isDevelopmentStore(admin: AdminApiContext): Promise<boolean> {
    try {
        const response = await admin.graphql(SHOP_PLAN_QUERY);
        const data = await response.json();
        return data?.data?.shop?.plan?.partnerDevelopment === true;
    } catch {
        return false;
    }
}

export async function getActiveSubscription(admin: AdminApiContext) {
    const response = await admin.graphql(ACTIVE_SUBSCRIPTION_QUERY);
    const data = await response.json();
    const subs = data?.data?.currentAppInstallation?.activeSubscriptions ?? [];
    if (subs[0]) return subs[0];

    if (await isDevelopmentStore(admin)) {
        return {
            id: null as string | null,
            name: "pro",
            status: "ACTIVE",
            createdAt: null as string | null,
            currentPeriodEnd: null as string | null,
            trialDays: 0,
            isDevStore: true,
            lineItems: [] as any[],
        };
    }
    return null;
}

// Days left until this subscription's free trial converts to a paid charge.
// Returns null when the shop isn't currently in a trial (no trialDays, or
// the trial window has already passed).
export function getTrialDaysRemaining(
    subscription: Awaited<ReturnType<typeof getActiveSubscription>>
): number | null {
    if (!subscription || !subscription.trialDays || !subscription.createdAt) return null;
    const createdAt = new Date(subscription.createdAt).getTime();
    const trialEndsAt = createdAt + subscription.trialDays * 24 * 60 * 60 * 1000;
    const msLeft = trialEndsAt - Date.now();
    if (msLeft <= 0) return null;
    return Math.ceil(msLeft / (24 * 60 * 60 * 1000));
}

export function getActivePlanKey(
    subscription: Awaited<ReturnType<typeof getActiveSubscription>>
): PlanKey | "free" | null {
    if (!subscription) return null;
    // Development stores run on the free plan (no Shopify subscription behind it).
    if ((subscription as { isDevStore?: boolean }).isDevStore) return "free";
    // Single paid plan now: every active subscription (including legacy Basic) is "pro".
    return "pro";
}

export async function createSubscription(
    admin: AdminApiContext,
    planKey: PlanKey,
    shop: string,
    returnPath = "/app/billing-return"
) {
    const plan = PLANS[planKey];
    const returnUrl = `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}${returnPath}`;

    const response = await admin.graphql(SUBSCRIPTION_CREATE, {
        variables: {
            name: plan.name,
            returnUrl,
            trialDays: plan.trialDays > 0 ? plan.trialDays : undefined,
            test: false,
            lineItems: [
                {
                    plan: {
                        appRecurringPricingDetails: {
                            price: { amount: plan.price, currencyCode: "USD" },
                            interval: plan.interval,
                        },
                    },
                },
            ],
        },
    });

    const data = await response.json();
    const result = data?.data?.appSubscriptionCreate;

    if (result?.userErrors?.length) {
        throw new Error(result.userErrors[0].message);
    }

    return result?.confirmationUrl as string;
}

export async function cancelSubscription(
    admin: AdminApiContext,
    subscriptionId: string
) {
    const response = await admin.graphql(SUBSCRIPTION_CANCEL, {
        variables: { id: subscriptionId },
    });
    const data = await response.json();
    const result = data?.data?.appSubscriptionCancel;
    if (result?.userErrors?.length) {
        throw new Error(result.userErrors[0].message);
    }
    return result?.appSubscription;
}
