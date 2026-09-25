import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

// The app name in the Shopify admin sidebar opens the app root. Always send it to the
// Overview page (keeping the shop/host params); with no params, /app shows the login form.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const qs = new URL(request.url).searchParams.toString();
  throw redirect(qs ? `/app?${qs}` : "/app");
};

export default function Index() {
  return null;
}
