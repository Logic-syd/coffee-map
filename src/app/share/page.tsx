"use client";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { useLocale } from "@/hooks/useLocale";
import { t } from "@/lib/i18n";
export default function SharePage() {
  const locale = useLocale();
  return (
    <>
      <TopBar showBack title={t("share.title", locale)} />
      <main className="mx-auto max-w-2xl space-y-6 p-6 text-base leading-relaxed text-inkblack">
        <h1 className="text-2xl font-bold">{t("share.title", locale)}</h1>
        <p>{t("share.intro", locale)}</p>
        <p>{t("share.fallback", locale)}</p>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-full bg-pinkaccent px-5 py-3 font-semibold text-white"
        >
          {t("action.explore", locale)}
        </Link>
      </main>
    </>
  );
}
