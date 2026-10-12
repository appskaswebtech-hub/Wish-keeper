import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { publish } from "../services/supportBus.server";

// Called by the standalone WishKeeper Admin Dashboard app when an admin
// replies to a merchant, so that merchant's open chat widget updates
// instantly over its existing SSE connection instead of polling. This route
// is NOT behind Shopify's authenticate.admin -- it's a server-to-server call
// from the dashboard, protected only by the shared secret below.
export const action = async ({ request }: ActionFunctionArgs) => {
  const secret = process.env.SUPPORT_INTERNAL_SECRET;
  if (!secret || request.headers.get("x-internal-secret") !== secret) {
    return data({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const shop = body?.shop;
  if (!shop) {
    return data({ error: "Missing shop" }, { status: 400 });
  }

  if (body?.message) {
    publish(`shop:${shop}`, { type: "message", message: body.message });
  } else if (body?.type === "typing") {
    // Lightweight, not persisted anywhere -- just tells the merchant's open
    // widget "the admin is typing right now".
    publish(`shop:${shop}`, { type: "typing", sender: "admin" });
  } else {
    return data({ error: "Missing message or typing event" }, { status: 400 });
  }

  return data({ ok: true });
};
