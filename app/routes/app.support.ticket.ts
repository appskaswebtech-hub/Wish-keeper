import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { authenticate } from "../shopify.server";
import { issueTicket } from "../services/supportTickets.server";

// Issues a short-lived ticket the client uses to open the SSE connection at
// /app/support/stream. This request itself goes through a normal fetch(),
// which App Bridge authenticates properly -- see app.support.stream.ts for
// why the SSE connection can't be authenticated the same way.
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const ticket = issueTicket(session.shop);
  return data({ ticket });
};
