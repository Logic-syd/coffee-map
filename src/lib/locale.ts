export const LANGUAGES = ["en", "ja", "ko", "zh-CN"] as const;
export type Language = (typeof LANGUAGES)[number];
export type LanguagePreference = Language | "system";
export const LANGUAGE_STORAGE_KEY = "coffee-map.language";
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  ja: "日本語",
  ko: "한국어",
  "zh-CN": "简体中文",
};
export function languagePreference(value: unknown): LanguagePreference {
  return LANGUAGES.some((language) => language === value)
    ? (value as Language)
    : "system";
}
export function resolveLanguage(
  preference: LanguagePreference,
  deviceLanguages: readonly string[],
): Language {
  if (preference !== "system") return preference;
  for (const tag of deviceLanguages) {
    const base = tag.toLowerCase().replace(/_/g, "-").split("-")[0];
    if (base === "zh") return "zh-CN";
    if (base === "en" || base === "ja" || base === "ko") return base;
  }
  return "en";
}
export function readLanguagePreference(
  storage?: Pick<Storage, "getItem">,
): LanguagePreference {
  try {
    return languagePreference(storage?.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return "system";
  }
}
export function saveLanguagePreference(
  storage: Pick<Storage, "setItem"> | undefined,
  preference: LanguagePreference,
): void {
  try {
    storage?.setItem(LANGUAGE_STORAGE_KEY, preference);
  } catch {
    /* Choice still applies to the current session. */
  }
}
