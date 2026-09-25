import db from "../db.server";

export async function getShopPlanFromDB(shop: string) {
    const record = await db.shopPlan.findUnique({ where: { shop } });

    if (!record) {
        return await db.shopPlan.create({
            data: {
                shop,
                plan: "none",
                status: "active",
            },
        });
    }

    return record;
}

export async function updateShopPlan(
    shop: string,
    plan: string,
    subscriptionId: string | null
) {
    const now = new Date();
    const status = plan === "none" ? "inactive" : "active";

    return db.shopPlan.upsert({
        where: { shop },
        update: {
            plan,
            subscriptionId,
            status,
            billingStartedAt: subscriptionId ? now : null,
        },
        create: {
            shop,
            plan,
            subscriptionId,
            status,
            billingStartedAt: subscriptionId ? now : null,
        },
    });
}

// Keeps the local ShopPlan row (used by the storefront proxy API) in sync
// with Shopify's live billing status (used to gate the admin UI). Without
// this, the two can drift apart if the one-time write in the billing return
// flow was ever missed or stale, silently disabling the storefront wishlist
// button even though the admin correctly shows an active plan.
export async function syncShopPlanFromSubscription(
    shop: string,
    subscription: { id: string | null; name?: string | null } | null
) {
    if (subscription) {
        const planKey = "pro";
        return updateShopPlan(shop, planKey, subscription.id);
    }
    return updateShopPlan(shop, "none", null);
}

export async function cancelShopPlan(shop: string) {
    return db.shopPlan.update({
        where: { shop },
        data: {
            plan: "none",
            subscriptionId: null,
            status: "cancelled",
            billingStartedAt: null,
        },
    });
}