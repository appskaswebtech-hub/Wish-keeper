import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";

const MAIN_THEME_SETTINGS_QUERY = `#graphql
  query {
    themes(first: 1, roles: [MAIN]) {
      nodes {
        id
        files(filenames: ["config/settings_data.json"]) {
          nodes {
            filename
            body {
              ... on OnlineStoreThemeFileBodyText {
                content
              }
            }
          }
        }
      }
    }
  }
`;

// Checks the live (published) theme's App Embeds config to see whether the
// WishKeeper header icon block is currently toggled on. Returns null when
// this can't be determined (API error, unexpected shape) so callers can
// avoid asserting a state we're not actually sure of.
export async function isWishlistIconEmbedEnabled(admin: AdminApiContext): Promise<boolean | null> {
  try {
    const response = await admin.graphql(MAIN_THEME_SETTINGS_QUERY);
    const json = await response.json();
    const theme = json?.data?.themes?.nodes?.[0];
    const file = theme?.files?.nodes?.find((f: any) => f.filename === "config/settings_data.json");
    const content = file?.body?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    const blocks = parsed?.current?.blocks || {};
    for (const key of Object.keys(blocks)) {
      const block = blocks[key];
      if (typeof block?.type === "string" && block.type.includes("/blocks/wishlist-header-icon/")) {
        return block.disabled !== true;
      }
    }
    return false;
  } catch (err) {
    console.error("[theme.server] isWishlistIconEmbedEnabled failed:", err);
    return null;
  }
}
