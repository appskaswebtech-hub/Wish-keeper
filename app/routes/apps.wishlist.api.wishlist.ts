import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import {
  getStoreByShop,
  getWishlistReadOnly,
  addWishlistItem,
  removeWishlistItem,
  isInWishlist,
  mergeGuestWishlist,
  getWishlistCount,
  getStoreSettingsByShop,
  clearWishlist,
} from "../services/wishlist.server";
import prisma from "../db.server";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const customerId = url.searchParams.get("customerId");
  const productId = url.searchParams.get("productId");
  const action = url.searchParams.get("action");

  if (!shop) {
    return data({ error: "Missing shop" }, { status: 400, headers: cors });
  }

  if (action === "settings") {
    const settings = await getStoreSettingsByShop(shop);
    const plan = await prisma.shopPlan.findFirst({ where: { shop, status: "active" } });
    const hasActivePlan = !!plan;
    return data({ settings, hasActivePlan }, { headers: cors });
  }

  if (!customerId) {
    return data({ error: "Missing customerId" }, { status: 400, headers: cors });
  }

  const store = await getStoreByShop(shop);
  if (!store || !store.isActive) {
    return data({ error: "Store not found" }, { status: 404, headers: cors });
  }

  if (action === "check" && productId) {
    const inWishlist = await isInWishlist(store.id, customerId, productId);
    return data({ inWishlist }, { headers: cors });
  }

  if (action === "count") {
    const count = await getWishlistCount(store.id, customerId);
    return data({ count }, { headers: cors });
  }

  const [wishlist, settings, plan] = await Promise.all([
    getWishlistReadOnly(store.id, customerId),
    getStoreSettingsByShop(shop),
    prisma.shopPlan.findFirst({ where: { shop, status: "active" } }),
  ]);
  const hasActivePlan = !!plan;
  return data({ wishlist, settings, hasActivePlan }, { headers: cors });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  try {
    const body = await request.json();
    const { shop, productId, variantId, action, guestId } = body;
    const customerId = body.customerId ? String(body.customerId) : null;

    if (!shop || !customerId) {
      return data({ error: "Missing shop or customerId" }, { status: 400, headers: cors });
    }

    const store = await prisma.store.upsert({
      where: { shop },
      update: { isActive: true },
      create: { shop },
    });
    await prisma.storeSettings.upsert({
      where: { storeId: store.id },
      update: {},
      create: { storeId: store.id },
    });

    switch (action) {
      case "add": {
        if (!productId) {
          return data({ error: "Missing productId" }, { status: 400, headers: cors });
        }
        const item = await addWishlistItem(store.id, customerId, productId, variantId);
        return data({ success: true, item }, { headers: cors });
      }
      case "remove": {
        if (!productId) {
          return data({ error: "Missing productId" }, { status: 400, headers: cors });
        }
        await removeWishlistItem(store.id, customerId, productId, variantId);
        return data({ success: true }, { headers: cors });
      }
      case "clear": {
        await clearWishlist(store.id, customerId);
        return data({ success: true }, { headers: cors });
      }
      case "merge": {
        if (!guestId) {
          return data({ error: "Missing guestId" }, { status: 400, headers: cors });
        }
        await mergeGuestWishlist(store.id, guestId, customerId);
        return data({ success: true }, { headers: cors });
      }
      default:
        return data({ error: `Unknown action: ${action}` }, { status: 400, headers: cors });
    }
  } catch (error: any) {
    console.error("[wishlist API error]", error);
    return data({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500, headers: cors });
  }
};

