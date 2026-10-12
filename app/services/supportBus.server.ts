// In-process pub/sub used to push new support-chat messages to open SSE
// connections instantly, with no polling. This app runs as a single
// long-lived Node process under PM2, so an in-memory map is enough; if it
// ever runs as multiple instances behind a load balancer, this would need
// to move to something shared (Redis pub/sub, etc.) to reach every instance.
type Listener = (event: unknown) => void;

const channels = new Map<string, Set<Listener>>();

export function subscribe(channel: string, listener: Listener): () => void {
  let set = channels.get(channel);
  if (!set) {
    set = new Set();
    channels.set(channel, set);
  }
  set.add(listener);
  return () => {
    set?.delete(listener);
    if (set && set.size === 0) channels.delete(channel);
  };
}

export function publish(channel: string, event: unknown) {
  const set = channels.get(channel);
  set?.forEach((listener) => {
    try {
      listener(event);
    } catch {
      // A broken listener shouldn't take down the publish for everyone else.
    }
  });
}

// Every shop's messages are also mirrored to this channel, so the future
// WishKeeper admin dashboard can subscribe to one stream and see new
// messages from any shop instead of one stream per shop.
export const ADMIN_CHANNEL = "__wk_support_admin__";
