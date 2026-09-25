import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useNavigation, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";
import { getStoreSettingsByShop } from "../services/wishlist.server";
import { resolveLanguage, getSessionLocale } from "../i18n/language.server";
import { getTranslator } from "../i18n/translations";
import loaderStyles from "../styles/loader.css?url";

export const links = () => [{ rel: "stylesheet", href: loaderStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = await getStoreSettingsByShop(session.shop);
  const language = resolveLanguage(settings?.language, getSessionLocale(session));
  return { apiKey: process.env.SHOPIFY_API_KEY || "", language };
};

export default function App() {
  const { apiKey, language } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isNavigating = navigation.state === "loading";
  const t = getTranslator(language);

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">{t("nav.overview")}</s-link>
        <s-link href="/app/welcome">{t("nav.setupVideo")}</s-link>
        <s-link href="/app/home">{t("nav.home")}</s-link>
        <s-link href="/app/wishlist">{t("nav.wishlists")}</s-link>
        <s-link href="/app/reports">{t("nav.reports")}</s-link>
        <s-link href="/app/settings">{t("nav.settings")}</s-link>
        <s-link href="/app/billing">{t("nav.billing")}</s-link>
      </s-app-nav>
      {isNavigating && (
        <div className="wk-loader-overlay">
          <div className="wk-loader">
            <span className="wk-loader-letter">W</span>
            <span className="wk-loader-ring" />
          </div>
        </div>
      )}
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};