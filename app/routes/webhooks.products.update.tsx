import { authenticate } from "../shopify.server";
import { processProductUpdateWebhook } from "../services/wishlist.server";

export const action = async ({ request }: { request: Request }) => {
  const { shop, topic, payload, admin } = await authenticate.webhook(request);

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
