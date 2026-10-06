"use client";
import { useId } from "react";
import { useLanguageSettings } from "@/hooks/useLocale";
import { LANGUAGES, LANGUAGE_NAMES, languagePreference } from "@/lib/locale";
import { t } from "@/lib/i18n";
export default function LanguagePicker() {
  const { locale, preference, setPreference } = useLanguageSettings();
  const id = useId();
  return (
    <div className="space-y-2 px-6 py-4">
      <label htmlFor={id} className="block text-sm font-semibold text-inkblack">
        {t("language.title", locale)}
      </label>
      <select
        id={id}
        value={preference}
        onChange={(event) =>
          setPreference(languagePreference(event.target.value))
        }
        className="min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-base text-inkblack"
      >
        <option value="system">{t("language.system", locale)}</option>
        {LANGUAGES.map((language) => (
          <option key={language} value={language} lang={language}>
            {LANGUAGE_NAMES[language]}
          </option>
        ))}
      </select>
    </div>
  );
}
