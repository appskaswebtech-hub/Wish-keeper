import crypto from "node:crypto";

// Browser EventSource can't carry Shopify's session-token Authorization
// header the way App Bridge's patched fetch() can, so the SSE stream route
// can't call authenticate.admin() directly on that request -- doing so fails
// instantly (no token present) and Shopify's library forces the whole
// embedded app to bounce out to re-login. Instead, the client first asks for
// a short-lived ticket over a normal authenticated fetch, then opens the SSE
// connection with that ticket in the query string.
const TICKET_TTL_MS = 20 * 60 * 1000; // 20 minutes

type Ticket = { shop: string; expiresAt: number };
const tickets = new Map<string, Ticket>();

function cleanup() {
  const now = Date.now();
  for (const [key, t] of tickets) {
    if (t.expiresAt <= now) tickets.delete(key);
  }
}

export function issueTicket(shop: string): string {
  cleanup();
  const ticket = crypto.randomUUID();
  tickets.set(ticket, { shop, expiresAt: Date.now() + TICKET_TTL_MS });
  return ticket;
}

export function resolveTicket(ticket: string | null): string | null {
  if (!ticket) return null;
  const entry = tickets.get(ticket);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    tickets.delete(ticket);
    return null;
  }
  return entry.shop;
}
