import type { LoaderFunctionArgs } from "react-router";
import { data as dataResponse } from "react-router";
import {
  getStoreByShop,
  getWishlistReadOnly,
  getStoreSettingsByShop,
} from "../services/wishlist.server";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const customerId = url.searchParams.get("customerId");

  if (!shop || !customerId) {
    return dataResponse({ error: "Missing params" }, { status: 400, headers: cors });
  }

  const store = await getStoreByShop(shop);
  if (!store) {
    return dataResponse({ error: "Store not found" }, { status: 404, headers: cors });
  }

  const settings = await getStoreSettingsByShop(shop);
  const storefrontToken = settings?.storefrontToken;

  if (!storefrontToken) {
    return dataResponse({ error: "Storefront token not configured" }, { status: 401, headers: cors });
  }

  const wishlist = await getWishlistReadOnly(store.id, customerId);

  if (!wishlist.items.length) {
    return dataResponse({ items: [], settings }, { headers: cors });
  }

  const productGids = wishlist.items.map((item) =>
    item.productId.startsWith("gid://") ? item.productId : `gid://shopify/Product/${item.productId}`
  );
  const variantGids = wishlist.items
    .filter((item) => item.variantId)
    .map((item) => (item.variantId!.startsWith("gid://") ? item.variantId! : `gid://shopify/ProductVariant/${item.variantId}`));
  const gids = [...productGids, ...variantGids];

  const query = `
    query getProductsAndVariants($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product {
          id
          title
          handle
          vendor
          featuredImage { url altText }
          priceRange {
            minVariantPrice { amount currencyCode }
          }
          variants(first: 1) {
            edges {
              node { id availableForSale }
            }
          }
        }
        ... on ProductVariant {
          id
          title
          availableForSale
          price { amount currencyCode }
          image { url altText }
          selectedOptions { name value }
          product {
            id
            handle
            title
            vendor
            featuredImage { url altText }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://${shop}/api/2025-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontToken,
      },
      body: JSON.stringify({ query, variables: { ids: gids } }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error("Storefront GraphQL errors:", JSON.stringify(result.errors));
      return dataResponse({ error: "GraphQL error", items: [], settings }, { status: 500, headers: cors });
    }

    const nodes = result?.data?.nodes || [];

    const enrichedItems = wishlist.items.map((item) => {
      const productGid = item.productId.startsWith("gid://")
        ? item.productId
        : `gid://shopify/Product/${item.productId}`;
      const variantGid = item.variantId
        ? (item.variantId.startsWith("gid://") ? item.variantId : `gid://shopify/ProductVariant/${item.variantId}`)
        : null;

      const variant = variantGid ? nodes.find((n: any) => n?.id === variantGid) : null;
      const product = nodes.find((n: any) => n?.id === productGid);

      if (variant) {
        const isDefaultVariant = variant.title === "Default Title";
        return {
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          addedAt: item.addedAt,
          product: {
            title: variant.product?.title || "",
            handle: variant.product?.handle || "",
            vendor: variant.product?.vendor,
            image: variant.image?.url || variant.product?.featuredImage?.url || null,
            imageAlt: variant.image?.altText || variant.product?.featuredImage?.altText || variant.product?.title,
            price: variant.price?.amount || "0",
            currency: variant.price?.currencyCode || "USD",
            available: variant.availableForSale ?? true,
            variantTitle: isDefaultVariant ? null : variant.title,
            selectedOptions: variant.selectedOptions || null,
          },
        };
      }

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        addedAt: item.addedAt,
        product: product
          ? {
              title: product.title,
              handle: product.handle,
              vendor: product.vendor,
              image: product.featuredImage?.url || null,
              imageAlt: product.featuredImage?.altText || product.title,
              price: product.priceRange?.minVariantPrice?.amount || "0",
              currency: product.priceRange?.minVariantPrice?.currencyCode || "USD",
              available: product.variants?.edges?.[0]?.node?.availableForSale ?? true,
              variantTitle: null,
              selectedOptions: null,
            }
          : null,
      };
    });

    return dataResponse({ items: enrichedItems, settings }, { headers: cors });
  } catch (error: any) {
    console.error("Storefront API error:", error);
    return dataResponse({ error: "Failed to fetch product data", items: [], settings }, { status: 500, headers: cors });
  }
};