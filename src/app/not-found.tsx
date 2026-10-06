"use client";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { t } from "@/lib/i18n";
export default function NotFound() {
  const locale = useLocale();
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 p-6 text-inkblack">
      <h1 className="text-2xl font-bold">{t("notFound.title", locale)}</h1>
      <p>{t("notFound.body", locale)}</p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center text-pinkaccent underline"
      >
        {t("action.list", locale)}
      </Link>
    </main>
  );
}
