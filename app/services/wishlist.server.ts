import prisma from "../db.server";
import { sendAlertEmail, backInStockTemplate, priceDropTemplate, lowStockTemplate } from "./mailer.server";

// ─── Store ───────────────────────────────────────────────────────────

export async function findOrCreateStore(shop: string, accessToken: string) {
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

  // Auto-fetch and save storefront token
  await autoSaveStorefrontToken(shop, accessToken, store.id);

  return store;
}

async function autoSaveStorefrontToken(shop: string, accessToken: string, storeId: string) {
  try {
    const response = await fetch(`https://${shop}/admin/api/2025-01/storefront_access_tokens.json`, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    const tokens = data?.storefront_access_tokens || [];

    let token = tokens.find((t: any) => t.title === "WishKeeper Backup");

    if (!token) {
      const createRes = await fetch(`https://${shop}/admin/api/2025-01/storefront_access_tokens.json`, {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storefront_access_token: { title: "WishKeeper Backup" },
        }),
      });
      const createData = await createRes.json();
      token = createData?.storefront_access_token;
    }

    if (token?.access_token) {
      await prisma.storeSettings.update({
        where: { storeId },
        data: { storefrontToken: token.access_token },
      });
    }
  } catch (err) {
    console.error("Failed to auto-save storefront token:", err);
  }
}

export async function getStoreByShop(shop: string) {
  return prisma.store.findUnique({ where: { shop } });
}

// ─── Settings ────────────────────────────────────────────────────────

export async function getStoreSettings(storeId: string) {
  return prisma.storeSettings.findUnique({ where: { storeId } });
}

export async function getStoreSettingsByShop(shop: string) {
  const store = await getStoreByShop(shop);
  if (!store) return null;
  return prisma.storeSettings.findUnique({ where: { storeId: store.id } });
}

export async function updateStoreSettings(
  storeId: string,
  data: {
    language?: string | null;
    showShareButton?: boolean;
    showItemCount?: boolean;
    maxItemsPerList?: number;
    showTitle?: boolean;
    showPrice?: boolean;
    showAddToCart?: boolean;
    showVendor?: boolean;
    gridColumns?: number;
    iconStyle?: string;
    activeColor?: string;
    headerIconEnabled?: boolean;
    storefrontToken?: string;
    customCss?: string;
    loadingIcon?: string;
    notAddedIcon?: string;
    addedIcon?: string;
    loadingIconColor?: string;
    customIconSvg?: string;
    customIconColor?: string;
    wishlistDisplayMode?: string;
    alertsEnabled?: boolean;
    lowStockThreshold?: number;
    smtpHost?: string | null;
    smtpPort?: number | null;
    smtpUser?: string | null;
    smtpPassword?: string | null;
    smtpFromEmail?: string | null;
    smtpFromName?: string | null;
  }
) {
  return prisma.storeSettings.upsert({
    where: { storeId },
    update: data,
    create: { storeId, ...data },
  });
}

// ─── Wishlist ────────────────────────────────────────────────────────

export async function getWishlist(storeId: string, customerId: string) {
  let wishlist = await prisma.wishlist.findFirst({
    where: { storeId, customerId },
    include: { items: { orderBy: { addedAt: "desc" } } },
  });

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { storeId, customerId, name: "My Wishlist" },
      include: { items: true },
    });
  }

  return wishlist;
}

export async function getWishlistReadOnly(storeId: string, customerId: string) {
  const wishlist = await prisma.wishlist.findFirst({
    where: { storeId, customerId },
    include: { items: { orderBy: { addedAt: "desc" } } },
  });
  return wishlist || { id: null, storeId, customerId, name: "My Wishlist", items: [] as any[] };
}

export async function getWishlistCount(storeId: string, customerId: string) {
  const wishlist = await prisma.wishlist.findFirst({
    where: { storeId, customerId },
  });
  if (!wishlist) return 0;
  return prisma.wishlistItem.count({ where: { wishlistId: wishlist.id } });
}

export async function addWishlistItem(
  storeId: string,
  customerId: string,
  productId: string,
  variantId?: string | null
) {
  const wishlist = await getWishlist(storeId, customerId);

  const existing = await prisma.wishlistItem.findFirst({
    where: { wishlistId: wishlist.id, productId, variantId: variantId || null },
  });
  if (existing) return existing;

  const settings = await prisma.storeSettings.findUnique({ where: { storeId } });
  const maxItems = settings?.maxItemsPerList ?? 50;
  const currentCount = await prisma.wishlistItem.count({ where: { wishlistId: wishlist.id } });

  if (currentCount >= maxItems) {
    throw new Error(`Wishlist is full. Maximum ${maxItems} items allowed.`);
  }

  const item = await prisma.wishlistItem.create({
    data: { wishlistId: wishlist.id, productId, variantId: variantId || null },
  });
  await prisma.wishlist.update({ where: { id: wishlist.id }, data: { updatedAt: new Date() } });
  await prisma.wishlistActivity.create({
    data: { wishlistId: wishlist.id, productId, variantId: variantId || null, action: "added" },
  });
  return item;
}

export async function removeWishlistItem(
  storeId: string,
  customerId: string,
  productId: string,
  variantId?: string | null
) {
  const wishlist = await prisma.wishlist.findFirst({ where: { storeId, customerId } });
  if (!wishlist) return null;

  // Match by product only, not variant: the "is this saved?" check (isInWishlist)
  // is product-level, so removal must be too, or a variant-specific remove can
  // silently match nothing when the item was originally saved without a variant.
  const result = await prisma.wishlistItem.deleteMany({
    where: { wishlistId: wishlist.id, productId },
  });
  if (result.count > 0) {
    await prisma.wishlistActivity.create({
      data: { wishlistId: wishlist.id, productId, variantId: variantId || null, action: "removed" },
    });
  }
  return result;
}

export async function clearWishlist(storeId: string, customerId: string) {
  const wishlist = await prisma.wishlist.findFirst({
    where: { storeId, customerId },
    include: { items: true },
  });
  if (!wishlist || wishlist.items.length === 0) return { count: 0 };

  await prisma.wishlistActivity.createMany({
    data: wishlist.items.map((item) => ({
      wishlistId: wishlist.id,
      productId: item.productId,
      variantId: item.variantId,
      action: "removed",
    })),
  });

  return prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id } });
}

export async function getWishlistActivity(wishlistId: string) {
  return prisma.wishlistActivity.findMany({
    where: { wishlistId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRecentActivity(storeId: string, limit = 8) {
  return prisma.wishlistActivity.findMany({
    where: { wishlist: { storeId } },
    include: { wishlist: { select: { customerId: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getTopShoppers(storeId: string, limit = 5) {
  const wishlists = await prisma.wishlist.findMany({
    where: { storeId, items: { some: {} } },
    include: { items: true },
    orderBy: { items: { _count: "desc" } },
    take: limit,
  });
  return wishlists;
}

export async function isInWishlist(storeId: string, customerId: string, productId: string) {
  const wishlist = await prisma.wishlist.findFirst({ where: { storeId, customerId } });
  if (!wishlist) return false;
  const item = await prisma.wishlistItem.findFirst({
    where: { wishlistId: wishlist.id, productId },
  });
  return !!item;
}

export async function mergeGuestWishlist(storeId: string, guestId: string, customerId: string) {
  const guestWishlist = await prisma.wishlist.findFirst({
    where: { storeId, customerId: guestId },
    include: { items: true },
  });

  if (!guestWishlist || guestWishlist.items.length === 0) return;

  const customerWishlist = await getWishlist(storeId, customerId);

  for (const item of guestWishlist.items) {
    const exists = await prisma.wishlistItem.findFirst({
      where: {
        wishlistId: customerWishlist.id,
        productId: item.productId,
        variantId: item.variantId,
      },
    });
    if (!exists) {
      await prisma.wishlistItem.create({
        data: {
          wishlistId: customerWishlist.id,
          productId: item.productId,
          variantId: item.variantId,
        },
      });
    }
  }

  await prisma.wishlistItem.deleteMany({ where: { wishlistId: guestWishlist.id } });
  await prisma.wishlist.delete({ where: { id: guestWishlist.id } });
}


// ─── Analytics ───────────────────────────────────────────────────────

export async function getAnalytics(storeId: string) {
  const totalItems = await prisma.wishlistItem.count({ where: { wishlist: { storeId } } });
  const totalWishlists = await prisma.wishlist.count({ where: { storeId } });
  const totalCustomers = await prisma.wishlist.groupBy({ by: ["customerId"], where: { storeId } });

  const topProducts = await prisma.wishlistItem.groupBy({
    by: ["productId"],
    where: { wishlist: { storeId } },
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
    take: 10,
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentItems = await prisma.wishlistItem.count({
    where: { wishlist: { storeId }, addedAt: { gte: sevenDaysAgo } },
  });

  const dailyCounts: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const count = await prisma.wishlistItem.count({
      where: { wishlist: { storeId }, addedAt: { gte: dayStart, lte: dayEnd } },
    });
    dailyCounts.push({
      date: dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count,
    });
  }

  return { totalItems, totalWishlists, totalCustomers: totalCustomers.length, topProducts, recentItems, dailyCounts };
}

export async function getWeeklyComparison(storeId: string) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [thisWeek, lastWeek] = await Promise.all([
    prisma.wishlistItem.count({ where: { wishlist: { storeId }, addedAt: { gte: weekAgo } } }),
    prisma.wishlistItem.count({ where: { wishlist: { storeId }, addedAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
  ]);

  const percentChange = lastWeek === 0 ? (thisWeek > 0 ? 100 : 0) : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  return { thisWeek, lastWeek, percentChange };
}

export async function getProductReport(storeId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const grouped = await prisma.wishlistItem.groupBy({
    by: ["productId"],
    where: { wishlist: { storeId } },
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
  });

  const total = grouped.length;
  const pageRows = grouped.slice(skip, skip + limit);

  return {
    rows: pageRows.map((r) => ({ productId: r.productId, actionCount: r._count.productId })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── Alerts (price drop / back in stock / low stock) ──────────────────

export async function getAlertCounts(storeId: string) {
  const rows = await prisma.wishlistAlert.groupBy({
    by: ["productId"],
    where: { storeId },
    _count: { productId: true },
  });
  const map: Record<string, number> = {};
  for (const r of rows) map[r.productId] = r._count.productId;
  return map;
}

export async function processProductUpdateWebhook(admin: any, shop: string, payload: any) {
  console.log("[alerts] webhook payload keys:", Object.keys(payload || {}));
  console.log("[alerts] payload.variants:", JSON.stringify(payload?.variants)?.slice(0, 500));

  const store = await prisma.store.findUnique({ where: { shop } });
  if (!store) {
    console.log("[alerts] no store found for shop", shop);
    return;
  }

  const settings = await prisma.storeSettings.findUnique({ where: { storeId: store.id } });
  if (!settings?.alertsEnabled) {
    console.log("[alerts] alertsEnabled is false, skipping");
    return;
  }

  const productId = String(payload.id);
  const variants = payload.variants || [];
  if (variants.length === 0) {
    console.log("[alerts] no variants in payload, skipping. Full payload:", JSON.stringify(payload)?.slice(0, 1000));
    return;
  }

  const prices = variants.map((v: any) => parseFloat(v.price)).filter((p: number) => !isNaN(p));
  const newPrice = prices.length > 0 ? Math.min(...prices) : null;
  const newInventory = variants.reduce(
    (sum: number, v: any) => sum + (typeof v.inventory_quantity === "number" ? v.inventory_quantity : 0),
    0
  );

  const watch = await prisma.productWatch.findUnique({
    where: { storeId_productId: { storeId: store.id, productId } },
  });

  console.log("[alerts] productId:", productId, "newPrice:", newPrice, "newInventory:", newInventory, "previousWatch:", watch);

  const events: Array<"back_in_stock" | "price_drop" | "low_stock"> = [];
  if (watch) {
    if ((watch.lastInventory ?? 0) <= 0 && newInventory > 0) events.push("back_in_stock");
    if (
      watch.lastInventory !== null &&
      watch.lastInventory > settings.lowStockThreshold &&
      newInventory > 0 &&
      newInventory <= settings.lowStockThreshold
    )
      events.push("low_stock");
    if (newPrice !== null && watch.lastPrice !== null && newPrice < watch.lastPrice) events.push("price_drop");
  }

  await prisma.productWatch.upsert({
    where: { storeId_productId: { storeId: store.id, productId } },
    update: { lastPrice: newPrice, lastInventory: newInventory },
    create: { storeId: store.id, productId, lastPrice: newPrice, lastInventory: newInventory },
  });

  console.log("[alerts] events detected:", events);

  if (events.length === 0) return;

  const items = await prisma.wishlistItem.findMany({
    where: { productId, wishlist: { storeId: store.id } },
    include: { wishlist: true },
  });
  const customerIds = [...new Set(items.map((i) => i.wishlist.customerId))].filter(
    (id) => !id.startsWith("guest_")
  );
  console.log("[alerts] wishlisted by customerIds:", customerIds);
  if (customerIds.length === 0) return;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentAlerts = await prisma.wishlistAlert.findMany({
    where: {
      storeId: store.id,
      productId,
      customerId: { in: customerIds },
      sentAt: { gte: since },
      type: { in: events },
    },
  });
  const alreadySent = new Set(recentAlerts.map((a) => `${a.customerId}:${a.type}`));

  const gids = customerIds.map((id) => `gid://shopify/Customer/${id}`);
  let emailMap: Record<string, string> = {};
  try {
    const res = await admin.graphql(
      `query GetCustomerEmails($ids: [ID!]!) { nodes(ids: $ids) { ... on Customer { id email } } }`,
      { variables: { ids: gids } }
    );
    const json = await res.json();
    for (const node of json.data?.nodes ?? []) {
      if (node?.id && node.email) emailMap[node.id.replace("gid://shopify/Customer/", "")] = node.email;
    }
  } catch (err) {
    console.error("[alerts] customer email lookup failed:", err);
  }

  console.log("[alerts] emailMap:", emailMap, "alreadySent:", [...alreadySent]);

  const productUrl = `https://${shop}/products/${payload.handle}`;

  for (const customerId of customerIds) {
    const email = emailMap[customerId];
    if (!email) {
      console.log("[alerts] no email found for customer", customerId, "skipping");
      continue;
    }
    for (const type of events) {
      if (alreadySent.has(`${customerId}:${type}`)) {
        console.log("[alerts] already sent", type, "to", email, "within 24h, skipping");
        continue;
      }

      let template;
      if (type === "back_in_stock") template = backInStockTemplate(payload.title, productUrl);
      else if (type === "low_stock") template = lowStockTemplate(payload.title, productUrl);
      else template = priceDropTemplate(payload.title, productUrl, watch?.lastPrice ?? newPrice ?? 0, newPrice ?? 0, "$");

      console.log("[alerts] attempting to send", type, "to", email);
      try {
        const result = await sendAlertEmail(settings, email, template.subject, template.html);
        console.log("[alerts] sendAlertEmail result:", result);
        await prisma.wishlistAlert.create({ data: { storeId: store.id, productId, customerId, type } });
        console.log("[alerts] SUCCESS: sent", type, "to", email);
      } catch (err) {
        console.error("[alerts] FAILED to send", type, "to", email, err);
      }
    }
  }
}

export async function deleteWishlist(storeId: string, wishlistId: string) {
  const wishlist = await prisma.wishlist.findUnique({ where: { id: wishlistId } });
  if (!wishlist || wishlist.storeId !== storeId) {
    throw new Error("Wishlist not found");
  }
  await prisma.wishlist.delete({ where: { id: wishlistId } });
}

export async function getAllWishlists(storeId: string, page = 1, limit = 20, sinceDate?: Date | null) {
  const skip = (page - 1) * limit;
  const where = sinceDate ? { storeId, updatedAt: { gte: sinceDate } } : { storeId };
  const [wishlists, total] = await Promise.all([
    prisma.wishlist.findMany({
      where,
      include: { items: { orderBy: { addedAt: "desc" }, take: 5 }, _count: { select: { items: true } } },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.wishlist.count({ where }),
  ]);
  return { wishlists, total, page, totalPages: Math.ceil(total / limit) };
}

