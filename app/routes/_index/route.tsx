import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

// Opened from the Shopify admin (app name in the sidebar): carries shop/host params, so go
// to the Overview page. A plain visit to the site root shows the public landing page.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const params = new URL(request.url).searchParams;
  const fromShopify = params.has("shop") || params.has("host") || params.has("embedded");
  if (fromShopify) throw redirect(`/app?${params.toString()}`);
  throw redirect("/home");
};

export default function Index() {
  return null;
}
