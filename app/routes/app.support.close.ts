import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { authenticate } from "../shopify.server";
import { closeThread } from "../services/supportChat.server";

// Merchant-initiated "End Chat" from the widget itself.
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  await closeThread(session.shop);
  return data({ ok: true });
};
