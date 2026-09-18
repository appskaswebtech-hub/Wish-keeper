import { type Language, isSupportedLanguage } from "./languages";

function fromShopifyLocale(locale: string | null | undefined): Language {
  const base = locale?.split("-")[0]?.toLowerCase();
  return isSupportedLanguage(base) ? base : "en";
}

export function resolveLanguage(savedLanguage: string | null | undefined, sessionLocale: string | null | undefined): Language {
  if (isSupportedLanguage(savedLanguage)) return savedLanguage;
  return fromShopifyLocale(sessionLocale);
}

export function getSessionLocale(session: object): string | null {
  const value = (session as { locale?: string | null }).locale;
  return typeof value === "string" ? value : null;
}
