import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { authenticate } from "../shopify.server";
import { findOrCreateStore, getWishlistActivity } from "../services/wishlist.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const store = await findOrCreateStore(session.shop, session.accessToken!);

  const url = new URL(request.url);
  const wishlistId = url.searchParams.get("wishlistId");
  if (!wishlistId) {
    return data({ error: "Missing wishlistId" }, { status: 400 });
  }

  const wishlist = await prisma.wishlist.findUnique({ where: { id: wishlistId } });
  if (!wishlist || wishlist.storeId !== store.id) {
    return data({ error: "Not found" }, { status: 404 });
  }

  const activity = await getWishlistActivity(wishlistId);

  let productMap: Record<string, { title: string; image: string | null }> = {};
  const productIds = [...new Set(activity.map((a) => a.productId))];
  if (productIds.length > 0) {
    const gids = productIds.map((id) =>
      id.startsWith("gid://") ? id : `gid://shopify/Product/${id}`
    );
    try {
      const res = await admin.graphql(
        `query GetActivityProducts($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Product { id title featuredImage { url } }
          }
        }`,
        { variables: { ids: gids } }
      );
      const json = await res.json();
      for (const node of json.data?.nodes ?? []) {
        if (node?.id) {
          const numId = node.id.replace("gid://shopify/Product/", "");
          productMap[numId] = { title: node.title, image: node.featuredImage?.url || null };
        }
      }
    } catch (_) {}
  }

  return data({ activity, productMap });
};
