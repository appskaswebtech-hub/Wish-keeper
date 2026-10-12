import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { authenticate } from "../shopify.server";

// Fires when the merchant is actively typing in the chat widget, so the
// admin dashboard can show a live "typing..." indicator. Not persisted
// anywhere -- just a fire-and-forget signal over the existing push channel.
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  notifyAdminDashboardTyping(session.shop).catch(() => {});
  return data({ ok: true });
};

async function notifyAdminDashboardTyping(shop: string) {
  const url = process.env.ADMIN_DASHBOARD_URL;
  const secret = process.env.SUPPORT_INTERNAL_SECRET;
  if (!url || !secret) return;
  await fetch(`${url.replace(/\/$/, "")}/internal/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Internal-Secret": secret },
    body: JSON.stringify({ shop, type: "typing" }),
  });
}
