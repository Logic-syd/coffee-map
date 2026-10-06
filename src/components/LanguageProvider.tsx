"use client";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  LANGUAGE_STORAGE_KEY,
  languagePreference,
  readLanguagePreference,
  resolveLanguage,
  saveLanguagePreference,
} from "@/lib/locale";
import type { Language, LanguagePreference } from "@/lib/locale";
export const LanguageContext = createContext<{
  locale: Language;
  preference: LanguagePreference;
  setPreference: (value: LanguagePreference) => void;
}>({ locale: "en", preference: "system", setPreference: () => {} });
function storage() {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
export default function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [preference, setChoice] = useState<LanguagePreference>("system");
  const [deviceLanguages, setDeviceLanguages] = useState<readonly string[]>([
    "en",
  ]);
  useEffect(() => {
    const updateDevice = () =>
      setDeviceLanguages(
        navigator.languages?.length
          ? navigator.languages
          : [navigator.language],
      );
    setChoice(readLanguagePreference(storage()));
    updateDevice();
    const updateStorage = (event: StorageEvent) => {
      if (event.key === LANGUAGE_STORAGE_KEY || event.key === null)
        setChoice(readLanguagePreference(storage()));
    };
    window.addEventListener("languagechange", updateDevice);
    window.addEventListener("storage", updateStorage);
    return () => {
      window.removeEventListener("languagechange", updateDevice);
      window.removeEventListener("storage", updateStorage);
    };
  }, []);
  const setPreference = useCallback((value: LanguagePreference) => {
    const choice = languagePreference(value);
    setChoice(choice);
    saveLanguagePreference(storage(), choice);
  }, []);
  const locale = resolveLanguage(preference, deviceLanguages);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const value = useMemo(
    () => ({ locale, preference, setPreference }),
    [locale, preference, setPreference],
  );
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
