"use client";
import { useLocale } from "@/hooks/useLocale";
import { t } from "@/lib/i18n";
import { FaCoffee } from "react-icons/fa";

export default function Loading() {
  const locale = useLocale();
  return (
    <div
      role="status"
      className="fixed inset-0 flex flex-col items-center justify-center bg-pinkcream z-50"
    >
      <FaCoffee className="text-pinkaccent animate-bounce" size={56} />
      <div className="mt-4 text-pinkaccent text-lg font-semibold animate-pulse tracking-wide">
        {t("loading", locale)}
      </div>
    </div>
  );
}
