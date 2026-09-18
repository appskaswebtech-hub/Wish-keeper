export const SUPPORTED_LANGUAGES = ["en", "de", "es", "fr", "it"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  de: "Deutsch (German)",
  es: "Español (Spanish)",
  fr: "Français (French)",
  it: "Italiano (Italian)",
};

export function isSupportedLanguage(value: string | null | undefined): value is Language {
  return !!value && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}
