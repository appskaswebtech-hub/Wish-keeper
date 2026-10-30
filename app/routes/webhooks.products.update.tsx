import { authenticate } from "../shopify.server";
import { processProductUpdateWebhook } from "../services/wishlist.server";

export const action = async ({ request }: { request: Request }) => {
  let shop, topic, payload, admin;
  try {
    ({ shop, topic, payload, admin } = await authenticate.webhook(request));
  } catch (err) {
    // Never let this 500: Shopify spends a retry on each one and deletes the
    // webhook subscription once they run out, silently cutting the shop off.
    // authenticate.webhook throws a Response, which the framework returns
    // without logging, so this is also the only place the cause is visible.
    console.error("[webhooks] products/update authenticate failed:", err);
    return new Response(null, { status: 200 });
  }

  console.log(`Webhook received: ${topic} for ${shop}`);

  if (topic === "PRODUCTS_UPDATE" && admin) {
    try {
      await processProductUpdateWebhook(admin, shop, payload);
    } catch (err) {
      console.error("[webhooks] products/update alert processing failed:", err);
    }
  }

  return new Response(null, { status: 200 });
};
