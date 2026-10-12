import type { LoaderFunctionArgs } from "react-router";
import { subscribe } from "../services/supportBus.server";
import { resolveTicket } from "../services/supportTickets.server";

// Server-Sent Events: one long-lived connection per open widget, pushed to
// the instant a message is sent (see supportChat.server.ts's publish call).
// No client-side polling anywhere in this feature.
//
// This route intentionally does NOT call authenticate.admin(request). The
// browser's native EventSource can't attach Shopify's session-token
// Authorization header the way App Bridge's patched fetch() does, so calling
// authenticate.admin() here fails on every request and forces the whole
// embedded app to bounce out to re-login. Instead the shop is identified by
// a short-lived ticket (see supportTickets.server.ts) obtained beforehand
// over a normal authenticated fetch.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = resolveTicket(url.searchParams.get("ticket"));

  if (!shop) {
    return new Response("Invalid or expired ticket", { status: 401 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Connection already closed; the abort handler below will clean up.
        }
      };

      send({ type: "connected" });
      const unsubscribe = subscribe(`shop:${shop}`, send);

      // Keeps proxies/load balancers from timing out an idle connection.
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(keepAlive);
        }
      }, 25000);

      request.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
};
