"use client";
import { useState } from "react";
import { Globe } from "lucide-react";
import LanguagePicker from "./LanguagePicker";
import { useLocale } from "@/hooks/useLocale";
import { t } from "@/lib/i18n";
export default function FloatingLang() {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {open && (
        <div className="mb-2 w-64 rounded-2xl border bg-white shadow-card">
          <LanguagePicker />
        </div>
      )}
      <button
        className="grid h-12 w-12 place-items-center rounded-full border-2 border-pinkaccent bg-pinkcream shadow-card"
        aria-label={t("language.title", locale)}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Globe size={26} />
      </button>
    </div>
  );
}
