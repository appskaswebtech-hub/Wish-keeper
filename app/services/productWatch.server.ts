import prisma from "../db.server";
import { unauthenticated } from "../shopify.server";

// Records the product's current price/stock the moment it's wishlisted, so a
// later restock, price change or low-stock update has a baseline to compare to.
export async function seedProductWatch(shop: string, storeId: string, productId: string) {
  if (!/^\d+$/.test(productId)) return;

  const existing = await prisma.productWatch.findUnique({
    where: { storeId_productId: { storeId, productId } },
  });
  if (existing) return;

  const settings = await prisma.storeSettings.findUnique({ where: { storeId } });
  if (!settings?.alertsEnabled) return;

  const { admin } = await unauthenticated.admin(shop);
  const res = await admin.graphql(
    `query SeedWatch($id: ID!) {
      product(id: $id) {
        totalInventory
        variants(first: 100) { nodes { price } }
      }
    }`,
    { variables: { id: `gid://shopify/Product/${productId}` } }
  );
  const json = await res.json();
  const product = json.data?.product;
  if (!product) return;

  const prices = (product.variants?.nodes ?? [])
    .map((v: any) => parseFloat(v.price))
    .filter((p: number) => !isNaN(p));

  await prisma.productWatch.upsert({
    where: { storeId_productId: { storeId, productId } },
    update: {},
    create: {
      storeId,
      productId,
      lastPrice: prices.length > 0 ? Math.min(...prices) : null,
      lastInventory: typeof product.totalInventory === "number" ? product.totalInventory : 0,
    },
  });
}
