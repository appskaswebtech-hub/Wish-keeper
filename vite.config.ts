import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, type UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import fs from "fs";
import path from "path";
import { WebSocketServer } from "ws";
// Related: https://github.com/remix-run/remix/issues/2835#issuecomment-1144102176
// Replace the HOST env var with SHOPIFY_APP_URL so that it doesn't break the Vite server.
// The CLI will eventually stop passing in HOST,
// so we can remove this workaround after the next major release.
if (
  process.env.HOST &&
  (!process.env.SHOPIFY_APP_URL ||
    process.env.SHOPIFY_APP_URL === process.env.HOST)
) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}

const host = new URL(process.env.SHOPIFY_APP_URL || "http://localhost")
  .hostname;

let hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host: host,
    port: parseInt(process.env.FRONTEND_PORT!) || 8002,
    clientPort: 443,
  };
}

export default defineConfig({
  server: {
    allowedHosts: [host],
    cors: {
      preflightContinue: true,
    },
    port: Number(process.env.PORT || 3000),
    hmr: hmrConfig,
    fs: {
      // See https://vitejs.dev/config/server-options.html#server-fs-allow for more information
      allow: ["app", "node_modules"],
    },
  },
  plugins: [
  {
  // Local dev picks a random port on every restart, which keeps breaking the
  // standalone WishKeeper Admin Dashboard's ability to push replies back to
  // this app (it has to know which port to call). This announces the real
  // port to the dashboard the moment the dev server comes up, so that sync
  // never has to be done by hand again. Entirely best-effort: if the
  // dashboard isn't running, this silently does nothing and never affects
  // this app's own startup or behavior. Re-announces periodically too, not
  // just once on startup -- the dashboard is a separate process that can be
  // restarted on its own (e.g. picking up a dashboard-only code change), and
  // when it comes back up it only has whatever URL was last saved in its own
  // .env until this app tells it otherwise. Without a repeat announcement,
  // a dashboard restart alone would silently go back to a stale/dead port.
  name: "announce-port-to-admin-dashboard",
  configureServer(server) {
    function announce() {
      try {
        const address = server.httpServer?.address();
        const port = typeof address === "object" && address ? address.port : null;
        const dashboardUrl = process.env.ADMIN_DASHBOARD_URL;
        const secret = process.env.SUPPORT_INTERNAL_SECRET;
        if (!port || !dashboardUrl || !secret) return;
        fetch(`${dashboardUrl.replace(/\/$/, "")}/internal/register-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Internal-Secret": secret },
          body: JSON.stringify({ url: `http://localhost:${port}` }),
        }).catch(() => {});
      } catch {
        // Never let this interfere with the dev server actually starting.
      }
    }
    server.httpServer?.once("listening", () => {
      announce();
      const timer = setInterval(announce, 30000);
      server.httpServer?.once("close", () => clearInterval(timer));
    });
  },
},
  {
  // Local dev only: the chat widget's live push was riding on Server-Sent
  // Events, and SSE's long-lived streamed HTTP response was getting
  // buffered somewhere between Vite's dev server and the browser (through
  // the Cloudflare quick tunnel this app's dev URL runs on), so pushed
  // messages only ever showed up after a manual reload. This app's own Vite
  // HMR already proves a real WebSocket connection survives that exact
  // tunnel reliably (that's what "[vite] connected" in the console is), so
  // the widget's live channel runs over a real WebSocket here instead.
  // Shares the exact same ticket/pubsub state as the rest of the app via
  // Vite's SSR module cache (ssrLoadModule) -- not a second, disconnected
  // copy. Production (react-router-serve) doesn't run Vite plugins at all,
  // so this doesn't exist there yet -- that needs its own setup once this
  // is actually deployed, since it won't have Vite's dev HTTP server to
  // attach to.
  name: "support-chat-ws-dev-bridge",
  configureServer(server) {
    const wss = new WebSocketServer({ noServer: true });

    server.httpServer?.on("upgrade", async (req, socket, head) => {
      if (!req.url || !req.url.startsWith("/app/support/ws")) return;
      try {
        const url = new URL(req.url, "http://localhost");
        const ticketMod: any = await server.ssrLoadModule("/app/services/supportTickets.server.ts");
        const shop = ticketMod.resolveTicket(url.searchParams.get("ticket"));
        if (!shop) {
          socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
          socket.destroy();
          return;
        }

        wss.handleUpgrade(req, socket, head, async (ws) => {
          const busMod: any = await server.ssrLoadModule("/app/services/supportBus.server.ts");
          const send = (data: unknown) => {
            try {
              ws.send(JSON.stringify(data));
            } catch {
              // Socket already closed; its own close handler cleans up.
            }
          };
          send({ type: "connected" });
          const unsubscribe = busMod.subscribe(`shop:${shop}`, send);

          const keepAlive = setInterval(() => {
            try {
              ws.ping();
            } catch {
              clearInterval(keepAlive);
            }
          }, 25000);

          ws.on("close", () => {
            clearInterval(keepAlive);
            unsubscribe();
          });
        });
      } catch (err) {
        console.error("[support-chat-ws-dev-bridge] error", err);
        socket.destroy();
      }
    });
  },
},
  {
  name: "static-html-pages",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const staticPages: Record<string, string> = {
        "/home": "public/home.html",
        "/privacy-policy": "public/privacy-policy.html",
      };
      const filePath = staticPages[req.url?.split("?")[0] ?? ""];
      if (filePath) {
        const fullPath = path.resolve(filePath);
        if (fs.existsSync(fullPath)) {
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(fs.readFileSync(fullPath, "utf-8"));
          return;
        }
      }
      next();
    });
  },
},

    reactRouter(),
    tsconfigPaths(),
  ],
  build: {
    assetsInlineLimit: 0,
  },
  optimizeDeps: {
    include: ["@shopify/app-bridge-react"],
  },
}) satisfies UserConfig;
